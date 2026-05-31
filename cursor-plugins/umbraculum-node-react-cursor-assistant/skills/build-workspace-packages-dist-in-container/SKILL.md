---
name: build-workspace-packages-dist-in-container
description: Use this proactively after editing any file under `packages/*/src/**` in a monorepo that commits `packages/*/dist/**` (e.g. this repo) — consumers (api / web / native) import from `dist/`, not `src/`, so the committed build outputs MUST be regenerated before restarting consumer containers. Also use when a consumer container boot fails with `SyntaxError: The requested module '@brewery/<name>' does not provide an export named 'XSchema'` (stale dist) or with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '<name>' imported from /app/src/...` (workspace package.json edited but `node_modules` not reinstalled in the consumer container).
---

# Skill: Build workspace packages (`dist/`) in a container

Use this when a monorepo commits package build outputs (for example `packages/*/dist/**`) and you need to rebuild them **without running npm on the host**.

## When to use (trigger conditions)

Invoke proactively whenever ANY of the following just happened in the session:

1. **You edited `packages/<name>/src/**`** — even a one-line edit. Consumer containers import from `dist/`, not `src/`. Without rebuilding, the consumer keeps resolving the pre-edit symbols.
2. **You added a new export to `packages/<name>/src/index.ts`** (or a re-exported sibling). Consumer code that references the new export will fail with `SyntaxError: The requested module '@brewery/<name>' does not provide an export named 'XSymbol'` until the dist is regenerated.
3. **You added a runtime dep to a consumer workspace's `package.json`** (e.g. added `zod` to `services/api/package.json`). The package.json edit on the host does NOT propagate to the consumer container's bind-mounted `node_modules`. After the dist rebuild, *also* run `docker compose exec -T <consumer> sh -c "cd /app && npm install --no-audit --no-fund"` then `docker compose restart <consumer>` so the new dep is resolvable inside the container.
4. **A consumer container is crash-looping with one of the two canonical failure modes above** (stale-dist `SyntaxError` or missing-dep `ERR_MODULE_NOT_FOUND`).

**Prefer scoped build first (umbraculum-dev):** if `<REPO_ROOT>/scripts/build-package-in-docker.sh` exists and only one (or diff-detected) package changed, use skill **`scoped-package-build-in-docker`** instead of full `build:packages`. Reserve this skill's full `build:packages` path for SDK publish, `--all` dist audits, or multi-package releases.

Skip this skill if the edit was confined to `apps/<name>/src/**`, `services/<name>/src/**`, or a documentation / config file — those do not produce committed `dist/` artifacts that consumers depend on.

## Inputs required (do not assume)
- `<NODE_CONTAINER>`
- `<REPO_WORKDIR_IN_CONTAINER>` (example: `/app`)
- `<NPM_INSTALL_CMD>` (example: `npm ci` or `npm install`)
- `<NPM_BUILD_SCRIPT>` (example: `build:packages`)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- Never run Node/npm on host for containerized repos.
- No speculative container names or working directories.
- Do not assume a specific monorepo layout; rely on `<NPM_BUILD_SCRIPT>` provided by the repo.

## Prerequisites
- Confirm `<NODE_CONTAINER>` is the correct container for Node/npm work in this repo.
- Confirm `<REPO_WORKDIR_IN_CONTAINER>` exists and is the repo root inside the container.
- Confirm the repo defines `<NPM_BUILD_SCRIPT>` (for example in root `package.json`).

## Commands (templates)

**Umbraculum-dev scoped path (preferred when script exists):**

1) `./scripts/build-package-in-docker.sh @umbraculum/<name> --include-dependents` from `<REPO_ROOT>`.

**Full monorepo fallback:**

1) Install dependencies (repo root):
   - `docker exec -i <NODE_CONTAINER> bash -lc 'cd <REPO_WORKDIR_IN_CONTAINER> && <NPM_INSTALL_CMD>'`
2) Build workspace package outputs:
   - `docker exec -i <NODE_CONTAINER> bash -lc 'cd <REPO_WORKDIR_IN_CONTAINER> && npm run -s <NPM_BUILD_SCRIPT>'`

Or from host (umbraculum-dev): `./scripts/build-packages-in-docker.sh` (runs `--all`).

## Stop conditions
- `<NODE_CONTAINER>` or `<REPO_WORKDIR_IN_CONTAINER>` is unknown/ambiguous.
- The command execution is blocked by allowlist/approval.
- The build script is missing or fails; return the minimal error excerpt and the failing command.
