---
name: docker-npm-volumes-runbook
description: Run npm one-shots and dev installs with warm named Docker volumes (umbraculum_npm_cache + node_modules trees) — Composer-vendor-like persistence on Linux and macOS. Use when docker run npm install is slow, when setting up scoped L1 tests, or when authoring scripts that invoke node:20-slim in umbraculum-class monorepos.
---

# Skill: Docker npm volumes runbook (warm cache + named node_modules)

## Why this skill exists

Bare `docker run --rm … npm ci` discards `/root/.npm` and `/repo/node_modules` every time — unlike Composer's persistent `vendor/` + cache. Umbraculum-dev ships **named volumes** and wrappers so repeat installs reuse tarballs and install trees on the same Docker host (Linux + Docker Desktop Mac).

Canonical human doc: umbraculum-dev [`docs/DEVELOPMENT-NPM-VOLUMES.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/DEVELOPMENT-NPM-VOLUMES.md).

## Inputs required (do not assume)

- `<REPO_ROOT>` — absolute monorepo root.
- `<COMMAND>` — shell command to run inside `node:20-slim` (quoted).
- `<NEEDS_ROOT_NODE_MODULES>` — `yes` if the command runs `npm install` at repo root (scoped workspace installs); `no` for typecheck-only with existing volume.

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

### Result

```
DOCKER-NPM-VOLUMES: OK|FAIL
```

## Bounds (hard)

- Max **3** commands.
- Never run project npm on the host.
- Use **named volumes only** — do not bind-mount `$HOME/.npm` (OS-specific paths, permission drift).

## Prerequisites

- Docker on PATH.
- For long-running api/web work: `docker compose up -d api` (or web) — service volumes warm automatically.
- Read `<REPO_ROOT>/docs/DEVELOPMENT-NPM-VOLUMES.md` when volume names or migration steps are needed.

## Volume names (umbraculum-dev)

| Volume | Container path | Use |
|--------|------------------|-----|
| `umbraculum_npm_cache` | `/root/.npm` | All one-shots + compose Node services |
| `umbraculum_root_node_modules` | `/repo/node_modules` | Scoped/full monorepo installs |
| `umbraculum_api_node_modules` | `/app/node_modules` | api compose service (not for manual one-shots) |

## Commands

### 1. Scoped package test (preferred one-shot)

```bash
cd <REPO_ROOT> && ./scripts/docker-npm-run.sh -r '<COMMAND>'
```

Example:

```bash
cd <REPO_ROOT> && ./scripts/docker-npm-run.sh -r \
  'npm install --no-audit --no-fund --prefer-offline -w @umbraculum/contracts --include-workspace-root && npm test -w @umbraculum/contracts'
```

### 2. Api iteration (no one-shot install)

```bash
cd <REPO_ROOT> && docker compose exec -T api sh -c 'cd /app && npm run test:unit'
```

### 3. After `package-lock.json` change (refresh api volume)

```bash
cd <REPO_ROOT> && docker compose exec -T api sh -c 'cd /app && npm install --no-audit --no-fund --prefer-offline'
```

Add `docker compose restart api` if routes 404 after a large git tree mutation (rule 51).

## Stop conditions

- `docker-npm-run.sh` missing → halt; cite `DEVELOPMENT-NPM-VOLUMES.md` for manual `-v umbraculum_npm_cache:/root/.npm` pattern.
- Install fails with cache corruption → `docker run --rm -v umbraculum_npm_cache:/root/.npm node:20-slim npm cache clean --force` once, retry.
- Lockfile changed but tests fail on stale deps → run refresh command (§3), not repeated blind installs.

## Fits the system

**Frontier-now:** Agents and contributors get Composer-like repeatability without host npm; pairs with **`verify-slice-runbook`**, **`scoped-package-build-in-docker`**, and **`ci-parity-local-reproduction`** (manifest `docker.volumes` since `@umbraculum/ci-parity` 1.0.8).

**Local-subagent-future:** Bounded input/output (`REPO_ROOT`, `-r` flag, single quoted command); stable volume names across repos adopting the same pattern.
