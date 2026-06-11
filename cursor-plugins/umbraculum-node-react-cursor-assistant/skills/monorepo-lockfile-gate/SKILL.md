---
name: monorepo-lockfile-gate
description: Agent-owned monorepo lockfile gate — regen root package-lock.json in node:20-slim, rm forbidden services/api/package-lock.json, run npm run check:lockfiles before commit and verify:pre-push before push. Use proactively when editing package-lock.json, workspace package.json deps, or when npm ci fails on lockfile sync. See rule 80-monorepo-lockfile-agent-gate.mdc.
---

# Skill: Monorepo lockfile gate (umbraculum-dev)

## Why this skill exists

Root `package-lock.json` must match what **`npm ci`** installs in **`node:20-slim`** (same as GHA). Host-only regen breaks lint/typecheck/native-deps. **`services/api/package-lock.json`** is an ephemeral forbidden artifact — agents must delete it, never commit it.

**Operator is an analyst:** agents run this skill; do not instruct the operator to "remember to regen the lockfile."

## Inputs required

- `<REPO_ROOT>` — absolute path (e.g. `/path/to/umbraculum-dev`).
- Whether the change set matches rule **`80-monorepo-lockfile-agent-gate.mdc`** triggers.

## Output format

### Prerequisites

(confirmed repo root, trigger applies, Docker available)

### Commands

(bounded list with exit codes)

### Stop conditions

(`(none triggered)` or halt reason)

### Result

```
MONOREPO-LOCKFILE-GATE <commit-or-WIP>: forbidden=OK|FAIL sync=OK|FAIL npm-ci=OK|FAIL|SKIPPED
```

## Bounds

- Max **4** commands.
- Root lockfile work: **`docker run node:20-slim`** — not host npm for regen/ci proof.
- Deleting `services/api/package-lock.json` on host is allowed (gitignored ephemeral file).

## Procedure

### 0. Remove forbidden lockfile (always when present)

```bash
cd <REPO_ROOT> && rm -f services/api/package-lock.json && ./scripts/check-monorepo-lockfiles.sh
```

### 1. Regenerate root lockfile (when `package.json` deps/overrides changed or lockfile out of sync)

```bash
cd <REPO_ROOT> && docker run --rm -v "$PWD:/repo" -w /repo node:20-slim \
  bash -lc "npm install --no-audit --no-fund"
```

Then prove clean install:

```bash
cd <REPO_ROOT> && docker run --rm -v "$PWD:/repo" -w /repo node:20-slim \
  bash -lc "npm ci --no-audit --no-fund"
```

### 2. Agent gate before commit (mandatory when `package-lock.json` is in the change set)

```bash
cd <REPO_ROOT> && npm run check:lockfiles
```

Expect: `check-monorepo-lockfiles: OK` and `check-root-lockfile-sync: OK`.

### 3. Before push (when commit includes `package-lock.json`)

```bash
cd <REPO_ROOT> && git status --porcelain   # must be clean
cd <REPO_ROOT> && npm run verify:pre-push
```

## Stop conditions

- `check-monorepo-lockfiles: FAIL` with forbidden path → remove file; never stage it.
- `check-root-lockfile-sync: FAIL` → run procedure **1**, re-run **2**; do not commit until OK.
- `npm ci` fails in container → do not push; fix lockfile in container, not on host.
- Doc-only change with no lockfile/manifest surface → skip (Result: `SKIPPED`).

## Do-not-regress checklist

- [ ] `services/api/.npmrc` contains `package-lock=false`.
- [ ] `docker-compose.yml` api command includes `rm -f package-lock.json` after install.
- [ ] Root lockfile regen used **`node:20-slim`**, not host npm alone.
- [ ] No `services/api/package-lock.json` in `git diff --cached`.

## Local-subagent-future readiness

Input-driven (`<REPO_ROOT>`), output-constrained (Result line), bounded (≤4 commands).
