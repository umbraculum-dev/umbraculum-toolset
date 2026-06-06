---
name: path-aware-pre-push
description: Bounded T2-PR pre-push procedure — resolve GHA-triggered ci-parity jobs from diff, run parallel isolated ci-parity, then native companions (API vitest when triggered). Use proactively before push instead of full sequential manifest. T2-release via verify:pre-push:release for manifest/pins/SDK tags.
---

# Skill: Path-aware T2-PR pre-push

## Why this skill exists

GHA runs **separate workflows in parallel** (lint, typecheck, docs-readmes) with path filters. Local T2 used to run **all five** manifest jobs **sequentially** (~8–15 min). T2-PR matches GHA scope and wall clock (~3–5 min typical).

## Inputs required

- `<REPO_ROOT>` — absolute monorepo root (e.g. `/home/rf/dkprojects/rfapps/umbraculum-dev`).
- `<BASE_REF>` — diff base (default: `origin/master`).

## Output format

### Prerequisites

(clean tree after commit, docker available, resolved job list)

### Commands

(bounded list with exit codes)

### Stop conditions

(`(none triggered)` or halt reason)

### Result

```
VERIFY-SLICE T2-PR @ <short-sha>: ci-parity=OK|FAIL jobs=<list> parallel=<N> api=OK|FAIL|SKIPPED
```

## Bounds

- Max **6** commands.
- All npm/ci-parity via `./scripts/ci-parity-check.sh` — not bare host npm.
- Commit before archive mode.

## Procedure

### 1. Commit + clean tree

```bash
cd <REPO_ROOT> && git status --porcelain
```

Working tree must be clean for archive replay.

### 2. Resolve jobs (optional inspect)

```bash
cd <REPO_ROOT> && python3 scripts/lib/verify-slice.py --repo-root . resolve-gha-triggers --base <BASE_REF>
cd <REPO_ROOT> && npm run validate:gha-triggers
```

### 3. T2-PR gate (default)

```bash
cd <REPO_ROOT> && npm run verify:pre-push
```

Runs path-aware parallel ci-parity + native companions when `.umbraculum/gha-trigger-map.json` matches the diff.

### 4. T2-release (manifest / pin / SDK tag prep only)

```bash
cd <REPO_ROOT> && npm run verify:pre-push:release
```

### 5. Push

Only after step 3 (or 4) is green.

## Stop conditions

- Uncommitted changes → commit first; do not treat `--ci` as push proof.
- `validate:gha-triggers` FAIL → sync `.umbraculum/gha-trigger-map.json` with workflow YAML.
- API vitest FAIL with unhandled errors → fix before push even if tests "passed".

## Local-subagent-future readiness

Input-driven (`<REPO_ROOT>`, `<BASE_REF>`), output-constrained (Result line), bounded (≤6 commands).
