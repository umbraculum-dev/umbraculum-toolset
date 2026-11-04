---
name: runtime-commands-containers
description: Use this when you need to suggest or run runtime commands in a containerized Node/TS/JS repo (compose services, docker run one-shots, E2E).
---

# Skill: Runtime commands safety (containers)

Use this when you need to suggest or run runtime commands in a **containerized Node/TS/JS** repo (Docker Compose services, `node:*-slim` one-shots, Playwright/E2E).

## Inputs required (do not assume)
- `<NODE_CONTAINER>` or `<COMPOSE_SERVICE>` (example: `web`, `api`)
- `<REPO_WORKDIR_IN_CONTAINER>` (example: `/repo`, `/app`)
- Optional: `<NODE_IMAGE>` (example: `node:22-slim` — read consumer `.umbraculum/ci-parity.json` / `docs/TYPING.md`)
- Optional: `<E2E_BASE_URL>` (if E2E applies)
- Optional: `<COMPOSE_FILE_PATH>` (if relevant)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- No speculative container names, compose file locations, bind mounts, or paths.
- Keep output bounded (no full logs/JSON dumps).

## Prerequisites
- Do not run container-specific commands automatically unless explicitly requested.
- Do not assume container names, compose file location, or bind mounts.
- Prefer project compose services or documented one-shot images over host Node/npm (see `node-npm-container-only`).

## Commands (templates)
1) Confirm `<NODE_CONTAINER>` / `<COMPOSE_SERVICE>` and `<REPO_WORKDIR_IN_CONTAINER>` from `DEVELOPMENT.md` / `DEVELOPMENT-LOCAL.md`.
2) Prefer `docker compose exec <service> …` for in-stack work, or `docker run … <NODE_IMAGE>` for one-shots matching CI.
3) For npm/install/build/test: run inside the container/image — never host npm for verification that must match CI.
4) For E2E: follow `playwright-runner-docs-gate` (quick gates before Playwright).
5) For static-analysis parity: prefer `npx @umbraculum/ci-parity` / project `./scripts/ci-parity-check.sh` when the repo ships them.

## Stop conditions
- Container/service name or workdir is unknown or ambiguous.
- Command execution requires allowlist/approval and is blocked.
- A step would require destructive host operations or guessing mounts/compose file selection.
