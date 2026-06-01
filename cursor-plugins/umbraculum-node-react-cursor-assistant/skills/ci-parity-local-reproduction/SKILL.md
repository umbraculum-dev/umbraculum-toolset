---
name: ci-parity-local-reproduction
description: Reproduce a CI static-analysis job (docs/lint/typecheck) in a clean `git archive HEAD` snapshot inside Docker when local checks pass but CI fails. Use when a developer reports a local-vs-CI divergence, OR proactively before pushing any commit with non-trivial CI surface. Eliminates four documented divergence mechanisms (gitignored cross-references, nested-workspace install drift, stale node_modules bind-mount shadowing, workspace hoisting splits). All npm/tsc/lint runs in-container — never on the host. See rule `72-ci-parity-local-vs-ci-divergence.mdc`.
---

# Skill: CI parity — reproduce a CI static-analysis job locally in a clean snapshot

## Why this skill exists

When CI fails on a check that the developer ran locally and saw green, the gap is almost always one of **four** local-vs-CI divergence mechanisms (documented in rule `72-ci-parity-local-vs-ci-divergence.mdc`). This skill implements the **T2 static-analysis gate** — use **`verify-slice-runbook`** for T0/T1 while iterating. See umbraculum-dev [`docs/VERIFICATION-TIERS.md`](../../umbraculum-dev/docs/VERIFICATION-TIERS.md).

**Cross-platform:** Linux, macOS, and WSL2 + Docker Desktop. Requires `git`, `bash`, and Docker on PATH — not host Node.js.

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
- **Repeat local runs:** umbraculum-dev manifests may declare `docker.volumes` (requires `@umbraculum/ci-parity` ≥ 1.0.8) for warm `umbraculum_npm_cache` + `umbraculum_root_node_modules`. See skill **`docker-npm-volumes-runbook`** and umbraculum-dev `docs/DEVELOPMENT-NPM-VOLUMES.md`. Does not apply to ephemeral GHA runners.

## Commands

### Recipe A (preferred — manifest + npm package)

If `<REPO_ROOT>/.umbraculum/ci-parity.json` exists (canonical for `umbraculum-dev`):

**Pre-push (agents — mandatory before push):** commit first, clean tree, then:

```bash
cd <REPO_ROOT> && npm run verify:pre-push
# equivalent:
cd <REPO_ROOT> && ./scripts/ci-parity-check.sh --archive run
```

Subset: `--jobs lint,typecheck` (or `docs-readmes` for docs-only).

**WIP iteration (not push proof):** `./scripts/ci-parity-check.sh run` (`--ci`, working tree).

Reproducing a historical failure: `npx @umbraculum/ci-parity@^1 run --sha <rev> --jobs <CI_JOB>`. Thin wrapper: `bash scripts/ci-parity-check.sh --archive run`.

Optional flags: `--keep`. Exit code 0 = all green; non-zero = one or more jobs failed. Read `.umbraculum/ci-parity.json` for install order and commands — do not hardcode `apps/web/e2e` paths in agent prose.

### Recipe B (fallback — manual reproduction)

If the repo does not yet ship a manifest, read the CI workflow file for the failing job and use the manual Docker recipe below. **Do not assume** nested-workspace install paths — grep the workflow for `cd` + `npm ci` steps.

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

   For `typecheck` (TypeScript `tsc --noEmit`; include any nested-workspace installs documented in the repo's CI workflow or `.umbraculum/ci-parity.json`):
   ```bash
   docker run --rm -v "$SNAP:/repo" -w /repo <NODE_IMAGE> bash -lc 'npm install --no-audit --no-fund --workspaces --include-workspace-root >/dev/null 2>&1 && (cd apps/web/e2e && npm install --no-audit --no-fund) >/dev/null 2>&1 && export PATH="/repo/node_modules/.bin:$PATH" && (cd apps/web/e2e && npm run typecheck)'
   ```

3. **If a job FAILed, identify the divergence mechanism** by inspecting the symptom:
   - "Broken relative link" / file not found in a README check → **mechanism 1** (gitignored cross-reference). Run `cd <REPO_ROOT> && git check-ignore -v <link-target>` to confirm.
   - `TS2307: Cannot find module 'X'` for a workspace devDep → **mechanism 2** (nested-workspace install drift). Run `grep workspaces <REPO_ROOT>/package.json` to confirm the workspace is not in the root glob.
   - Type-aware ESLint rule fires here but not in your live-workspace local run → **mechanism 3** (stale node_modules shadowing). Verify you mounted a `git archive` snapshot, not `$PWD`; if you mounted the live tree, `ls <REPO_ROOT>/<workspace>/node_modules/ | head` may be non-empty.
   - `TS2339` on a plugin-augmented method (e.g. `app.swagger()`) in CI only, green in dev container → **mechanism 4** (workspace hoisting splits). Reproduce with hoisted root `npm ci --workspaces`; add workspace-local module augmentation if needed.

4. **Clean up via docker** (the snapshot has root-owned files from in-container npm install; host `rm` won't work):
   ```bash
   docker run --rm -v /tmp:/host-tmp <NODE_IMAGE> rm -rf "/host-tmp/$(basename "$SNAP")"
   ```

## Stop conditions

- `<REPO_ROOT>` is unknown or is not a git repo → halt and ask.
- `docker` is not on PATH or user lacks docker access → halt and report.
- `git archive <COMMIT_SHA>` fails (bad ref) → halt and ask for a valid SHA.
- **Agent was about to recommend host `python3` / host `npm run lint` / `docker compose exec` / live-workspace `docker run` as the pre-push gate** → stop; use Recipe A (`npx @umbraculum/ci-parity`) instead. Those are debug-only per rule `72-ci-parity-local-vs-ci-divergence.mdc` § Agent anti-patterns.
- The failing CI job is NOT in `{docs, lint, typecheck}` (e.g. an integration test, a Playwright e2e, a real-DNS check, a deploy step) → halt and report; this skill covers static-analysis CI jobs only. For GHA **`api`** (`services/api` vitest + Redis), use skill **`api-integration-tests-pre-push`** instead. Other out-of-scope failures need their own runbook.
- After Recipe A or B, all three jobs report OK but CI is still failing → likely a CI-side issue (cache, runner image drift, secret leak); escalate rather than rerunning the local recipe.
- The repo's CI workflow uses a non-`node:20-slim` image and the operator did not provide `<NODE_IMAGE>` → halt and ask.

## Local-subagent-future readiness

Input-driven (4 named placeholders, one with a documented default), output-constrained (Prerequisites / Commands / Stop conditions / Result), bounded (max 5 commands; 3-error cap per failing job; no loops). Recipe A is a single-command short-circuit; Recipe B is a 4-command manual fallback. Suitable for a future Ollama local-model variant invoked by a `ci-parity` subagent or by the operator directly via `/ci-parity`.
