---
name: ci-parity-local-reproduction
description: Reproduce a CI static-analysis job (docs/lint/typecheck) in a clean `git archive HEAD` snapshot when local checks pass but CI fails. Use when a developer reports a local-vs-CI divergence, OR proactively before pushing any commit with non-trivial CI surface (most sub-plan #9 slot commits). Eliminates the three documented divergence mechanisms (gitignored cross-references, nested-workspace install drift, stale `<workspace>/node_modules` bind-mount shadowing). See rule `72-ci-parity-local-vs-ci-divergence.mdc`.
---

# Skill: CI parity — reproduce a CI static-analysis job locally in a clean snapshot

## Why this skill exists

When CI fails on a check that the developer ran locally and saw green, the gap is almost always one of three local-vs-CI divergence mechanisms (documented in rule `72-ci-parity-local-vs-ci-divergence.mdc` and originally isolated 2026-05-19 during sub-plan #9 slot 7 — umbraculum-dev `docs/design/brewery-scope-migration-plan.md` §6.7). The recipe below reproduces a CI job against a **clean `git archive HEAD` snapshot** under `/tmp/ci-parity-<sha>`, eliminating all three mechanisms at once: no host node_modules bind-mount, no gitignored files visible, no stale workspace state.

## Inputs required (do not assume)

- `<REPO_ROOT>` — absolute path to the repo root (e.g. `/home/rf/dkprojects/rfapps/umbraculum-dev`).
- `<COMMIT_SHA>` — git ref to reproduce. Default: `HEAD`. Use a specific SHA when reproducing a historical CI failure.
- `<CI_JOB>` — one of: `docs` (README/link checker), `lint` (ESLint), `typecheck` (`tsc --noEmit` across workspaces), `all` (all three).
- `<NODE_IMAGE>` — the docker image the CI workflow uses. Default: `node:20-slim`. **Do not assume**: read the workflow file to confirm (some workflows pin a specific minor version or use a different base image).

## Output format (return exactly)

### Prerequisites

(what was inferred from inputs — confirmed repo root, confirmed CI job choice, confirmed docker image, whether the repo ships `scripts/ci-parity-check.sh`)

### Commands

(the bounded list of commands run, with exit codes per job)

### Stop conditions

(`(none triggered)` if the reproduction completed; otherwise the specific stop, e.g. `repo does not ship scripts/ci-parity-check.sh and <REPO_ROOT> is unknown`)

### Result

```
CI-PARITY-CHECK <commit-sha>: docs=<OK|FAIL|SKIPPED> lint=<OK|FAIL|SKIPPED> typecheck=<OK|FAIL|SKIPPED>
DIVERGENCE-MECHANISM (if CI failed and local passed): <gitignored-cross-ref | nested-workspace-install-drift | stale-node-modules-shadowing | unknown — escalate>
```

If any job FAILed, append up to 3 lines of the failing output (the actual error from the docker run, not a summary).

## Bounds (hard)

- Max **5** commands.
- No loops; no polling; no speculative paths or container names.
- Bounded output: never dump the full lint/typecheck log; cap to 3 error lines per failing job. The full log lives in `/tmp/ci-parity-<sha>.logs/<job>.log` for the operator to read directly.
- This skill is **read-only with respect to the repo's tracked tree**. It writes only to `/tmp/ci-parity-<sha>/` and `/tmp/ci-parity-<sha>.logs/`. It does NOT edit any tracked file.

## Prerequisites

- `<REPO_ROOT>` exists and is a git repo.
- `docker` is on PATH and the user is in the docker group (or has sudoless docker access).
- `<NODE_IMAGE>` is pullable (or already pulled).
- If reproducing local edits not yet committed: stash or temporarily commit them so `git archive <COMMIT_SHA>` captures the state being tested. (`git archive` only sees committed state.)

## Commands

### Recipe A (preferred — repo ships canonical script)

If `<REPO_ROOT>/scripts/ci-parity-check.sh` exists (canonical implementation for `umbraculum-dev`), run it directly. It does all three jobs in one shot (~2 min), with correct ordering (lint BEFORE the e2e install so its state matches `web-lint.yml`; typecheck AFTER so its state matches `typecheck.yml`):

```bash
cd <REPO_ROOT> && bash scripts/ci-parity-check.sh
```

Optional flags: `--sha <rev>` (target a specific revision; default HEAD), `--keep` (preserve the `/tmp/ci-parity-<sha>` snapshot + logs for post-mortem). Exit code 0 = all green; 1 = one or more jobs failed (per-job status printed); 2 = pre-job FATAL.

### Recipe B (fallback — manual reproduction for repos without the script)

If the repo does not yet ship `ci-parity-check.sh`, use the manual 4-command recipe:

1. **Create the clean snapshot** (host shell):
   ```bash
   SNAP=/tmp/ci-parity-<short-sha> && mkdir -p "$SNAP" && cd <REPO_ROOT> && git archive <COMMIT_SHA> -o "$SNAP.tar" && tar -xf "$SNAP.tar" -C "$SNAP" && rm -f "$SNAP.tar"
   ```

2. **Run the single job inside `<NODE_IMAGE>`** (pick the one CI is failing — repeat per job if `<CI_JOB>=all`):

   For `docs` (Python-based README/link checker):
   ```bash
   docker run --rm -v "$SNAP:/repo" -w /repo <NODE_IMAGE> bash -lc 'apt-get update -qq >/dev/null && apt-get install -y -qq python3 >/dev/null && python3 scripts/docs/check-readmes.py'
   ```

   For `lint` (ESLint; note: NO nested-workspace install before lint — state must match the actual web-lint.yml workflow):
   ```bash
   docker run --rm -v "$SNAP:/repo" -w /repo -e NODE_OPTIONS='--max-old-space-size=6144' <NODE_IMAGE> bash -lc 'npm install --no-audit --no-fund --workspaces --include-workspace-root >/dev/null 2>&1 && npm run lint'
   ```

   For `typecheck` (TypeScript `tsc --noEmit`; INCLUDES the explicit nested-workspace install for any workspace not matched by the root `workspaces:` glob — adjust the `(cd <nested-ws> && npm install ...)` line per your repo's layout):
   ```bash
   docker run --rm -v "$SNAP:/repo" -w /repo <NODE_IMAGE> bash -lc 'npm install --no-audit --no-fund --workspaces --include-workspace-root >/dev/null 2>&1 && (cd apps/web/e2e && npm install --no-audit --no-fund) >/dev/null 2>&1 && export PATH="/repo/node_modules/.bin:$PATH" && (cd apps/web/e2e && npm run typecheck)'
   ```

3. **If a job FAILed, identify the divergence mechanism** by inspecting the symptom:
   - "Broken relative link" / file not found in a README check → **mechanism 1** (gitignored cross-reference). Run `cd <REPO_ROOT> && git check-ignore -v <link-target>` to confirm.
   - `TS2307: Cannot find module 'X'` for a workspace devDep → **mechanism 2** (nested-workspace install drift). Run `grep workspaces <REPO_ROOT>/package.json` to confirm the workspace is not in the root glob.
   - Type-aware ESLint rule fires here but not in your live-workspace local run → **mechanism 3** (stale node_modules shadowing). Verify `ls <REPO_ROOT>/<workspace>/node_modules/ | head` is non-empty in the live workspace.

4. **Clean up via docker** (the snapshot has root-owned files from in-container npm install; host `rm` won't work):
   ```bash
   docker run --rm -v /tmp:/host-tmp <NODE_IMAGE> rm -rf "/host-tmp/$(basename "$SNAP")"
   ```

## Stop conditions

- `<REPO_ROOT>` is unknown or is not a git repo → halt and ask.
- `docker` is not on PATH or user lacks docker access → halt and report.
- `git archive <COMMIT_SHA>` fails (bad ref) → halt and ask for a valid SHA.
- The failing CI job is NOT in `{docs, lint, typecheck}` (e.g. an integration test, a Playwright e2e, a real-DNS check, a deploy step) → halt and report; this skill covers static-analysis CI jobs only. Out-of-scope failures need their own runbook (per-job skill or live-stack reproduction via `docker compose exec`).
- After Recipe A or B, all three jobs report OK but CI is still failing → likely a CI-side issue (cache, runner image drift, secret leak); escalate rather than rerunning the local recipe.
- The repo's CI workflow uses a non-`node:20-slim` image and the operator did not provide `<NODE_IMAGE>` → halt and ask.

## Local-subagent-future readiness

Input-driven (4 named placeholders, one with a documented default), output-constrained (Prerequisites / Commands / Stop conditions / Result), bounded (max 5 commands; 3-error cap per failing job; no loops). Recipe A is a single-command short-circuit; Recipe B is a 4-command manual fallback. Suitable for a future Ollama local-model variant invoked by a `ci-parity` subagent or by the operator directly via `/ci-parity`.
