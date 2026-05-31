---
name: scoped-package-build-in-docker
description: Rebuild one or more workspace package dist/ outputs via scripts/build-package-in-docker.sh without full npm ci + build:packages. Use proactively after editing packages/*/src/** when the umbraculum-dev repo ships the scoped build script — prefer this over build-workspace-packages-dist-in-container for single-package edits.
---

# Skill: Scoped package build in Docker (umbraculum-class monorepos)

## Why this skill exists

Full `./scripts/build-packages-in-docker.sh` runs `npm ci` + all 16 `build:packages` workspaces (~15–25 min, network-fragile). Umbraculum-dev ships **`scripts/build-package-in-docker.sh`** for scoped rebuilds with a warm `node_modules` volume (~1–2 min).

## Inputs required (do not assume)

- `<REPO_ROOT>` — absolute path to monorepo root (e.g. `/path/to/umbraculum-dev`).
- `<WORKSPACE>` — npm workspace name (e.g. `@umbraculum/contracts`). Required unless using `--from-diff`.
- `<INCLUDE_DEPENDENTS>` — `yes` or `no`. Default: `yes` when dist drift affects consumers.
- `<FRESH>` — `yes` to force `npm ci`; default `no`.

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

### Result

```
SCOPED-PACKAGE-BUILD <workspace>: OK|FAIL
```

## Bounds (hard)

- Max **3** commands.
- Never run npm on host.
- If `scripts/build-package-in-docker.sh` is missing, stop and fall back to skill **`build-workspace-packages-dist-in-container`**.

## Prerequisites

- `<REPO_ROOT>/scripts/build-package-in-docker.sh` exists and is executable.
- Docker on PATH.
- `<WORKSPACE>` is listed in `<REPO_ROOT>/.umbraculum/package-build-graph.json` when not using `--from-diff`.

## Commands

1. Scoped build (preferred):

```bash
cd <REPO_ROOT> && ./scripts/build-package-in-docker.sh <WORKSPACE> --include-dependents
```

Add `--fresh` only when lockfile deps are broken or `<FRESH>` is `yes`.

2. Diff-driven build (when multiple packages may have changed):

```bash
cd <REPO_ROOT> && ./scripts/build-package-in-docker.sh --from-diff main --include-dependents
```

3. Verify dist committed (optional T1 gate):

```bash
cd <REPO_ROOT> && ./scripts/check-packages-dist-up-to-date.sh
```

## Stop conditions

- Script missing → use **`build-workspace-packages-dist-in-container`** with full `build:packages`.
- Build fails with network error → retry once; do not loop.
- Unknown workspace name → read `.umbraculum/package-build-graph.json` and halt.

## Fits the system

Input-driven, output-constrained, bounded (≤3 commands). Complements **`verify-slice-runbook`** (T1) and rule **`76-verification-tiers-gate`**.
