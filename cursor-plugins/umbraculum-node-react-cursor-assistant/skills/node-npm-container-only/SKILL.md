---
name: node-npm-container-only
description: Use this when you need to run Node/npm tasks in a containerized project.
---

# Skill: Node/npm container-only execution

Use this when you need to run Node/npm tasks in a containerized project.

## Project vs host (read first)

| Surface | Role |
|--------|------|
| **Docker** (compose service, `node:20-slim`, ci-parity manifest) | **Canonical** — what GHA and `verify:pre-push` use |
| **Host** (`node` / `npm` on the laptop) | **Not part of the project** — varies per user; never the push gate |

Host Node/npm can crash (e.g. Node 14 + global npm 11) or disagree with CI. Running `npm view` or `./scripts/dogfood-npm-smoke.sh` on the host has produced false "not on registry" results while container runs were green.

**Default:** all Node/npm in container. **Host only** after operator explicitly approves — state cons (non-reproducible, not CI parity, must re-verify in container before done).

## Inputs required (do not assume)
- `<NODE_CONTAINER>` or `<DOCKER_IMAGE>` (e.g. `node:20-slim`, compose `api` / `web`)
- `<REPO_WORKDIR_IN_CONTAINER>` (example: `/app`, `/repo`)
- `<NPM_SCRIPT>` or shell command (example: `build`, `npm view @scope/pkg@1.2.3 version`)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling on the **host**; registry polls use container `npm view` or `curl` to registry.npmjs.org.
- Never run Node/npm on host for containerized repos unless operator approved host exception.
- No speculative container names or working directories.

## Prerequisites
- Confirm the correct Node container/image for the stack; if ambiguous, ask (do not guess).
- Verify the working directory exists in the container (common examples: `/app`, `/repo`, `/opt/playwright-suite`).
- For umbraculum-dev pre-push: prefer `./scripts/ci-parity-check.sh` (orchestrates `node:20-slim`) over ad-hoc host npm.

## Commands (templates)

**Compose dev service:**
```bash
docker compose exec -T <NODE_CONTAINER> bash -lc 'cd <REPO_WORKDIR_IN_CONTAINER> && npm run -s <NPM_SCRIPT>'
```

**One-shot CI image (registry check, smoke script, no compose):**
```bash
docker run --rm -v "$PWD:/repo" -w /repo public.ecr.aws/docker/library/node:20-slim \
  bash -lc 'npm view @umbraculum/api-client@0.0.3 version'
```

```bash
docker run --rm -v "$PWD:/repo" -w /repo public.ecr.aws/docker/library/node:20-slim \
  bash -lc './scripts/dogfood-npm-smoke.sh'
```

For **one-shot** `docker run … npm install` in umbraculum-class monorepos, use skill **`docker-npm-volumes-runbook`** (`./scripts/docker-npm-run.sh -r`) — do not discard the npm cache every run.

## Stop conditions
- `<NODE_CONTAINER>` / image or `<REPO_WORKDIR_IN_CONTAINER>` is unknown/ambiguous.
- The exec command is blocked by allowlist/approval — ask operator; do not fall back to host npm silently.
- Operator has not approved a host exception when container path is blocked.
