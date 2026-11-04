# DEVELOPMENT-LOCAL.md (optional per-developer project context)

This file is per-developer (typically gitignored) and is not synced by the plugin.

If this file exists at repo root, the Cursor assistant plugin reads it early and treats it as project-specific context. If it does not exist, the assistant proceeds normally and asks for missing values only when a task requires them.

You can either hand-write this file using the template below, or ask the agent to generate it for you from your project's `DEVELOPMENT.md` (e.g. "create my DEVELOPMENT-LOCAL.md"). The agent will then invoke the `generate-development-local` skill — it reads `DEVELOPMENT.md`, reads `DEVELOPMENT-LOCAL-OLLAMA.md` if present, fills in everything it can derive, and asks you for the remaining `<fill_me>` values.

Sibling, project-versioned addendum: if your project also commits a `DEVELOPMENT-LOCAL-OLLAMA.md` at repo root (the local-model-runtime addendum — Ollama model id, endpoint URL, `.local.md` agent/subagent variants in use), the assistant reads it alongside this file at session start. That file is project-versioned (lives in the project's main repo); this file is per-developer.

Keep this file short and high-signal. Put reusable procedures in plugin Skills instead of duplicating long runbooks here.

## Project summary

- Project type: `<fill_me — e.g. umbraculum-dev platform monorepo>`
- Main stack: `<fill_me — e.g. Next.js + Fastify + Prisma + Tamagui 3 + Expo SDK 58; Node ≥22.13 in node:22-slim>`
- Important docs:
  - `DEVELOPMENT.md`
  - `docs/CURSOR-PLUGINS.md`
  - `docs/TESTING.md`
  - `docs/CI-PARITY.md`

## Canonical locations (examples only)

- Canonical repo root: `/path/to/umbraculum-dev`
- Cursor worktree root (if applicable): `/path/to/cursor-worktree`
- Runtime/container workdir (if applicable): `/repo` (ci-parity / one-shot) or compose service workdir

## Containers / services (fill in; do not assume)

Compose service names and one-shot image come from the project's `DEVELOPMENT.md` / `.umbraculum/ci-parity.json`. Typical umbraculum-dev shape:

- `<WEB_CONTAINER>` / compose `web`: `<fill_me>`
- `<API_CONTAINER>` / compose `api`: `<fill_me>`
- `<NODE_IMAGE>` (ci-parity / one-shots): `<fill_me — umbraculum-dev: public.ecr.aws/docker/library/node:22-slim>`
- `<DB_CONTAINER>` / Postgres: `<fill_me>`
- `<E2E_API_CONTAINER>` (if distinct from api): `<fill_me>`

## Local stack notes

- Local base URL: `<fill_me — e.g. http://localhost>`
- Health check: `<fill_me — e.g. http://localhost/healthz>`
- Known slow commands / expected timeouts:
  - `<fill_me — e.g. first npm ci in node:22-slim, verify:pre-push>`
- Commands that require confirmation before running:
  - `<fill_me>`
- Commands that are forbidden in this project:
  - `<fill_me — e.g. host npm for lockfile/CI parity; global plugin rsync>`

## E2E defaults (only if stable for this project)

- `<E2E_BASE_URL>`: `<fill_me>` (umbraculum-dev example: gateway URL from `apps/web/e2e/README.md`)
- Seed / fixture notes: `<fill_me — point at apps/web/e2e/README.md + docs/TESTING.md § L5>`

Playwright: before any suite run, agents must execute the **quick gates** in `playwright-runner-docs-gate` skill (stack up, smoke/health, login page). Umbraculum-dev canonical copy: `apps/web/e2e/README.md` + `docs/TESTING.md` § L5.

## Protected branches / Git conventions

- Protected branches: `<fill_me — e.g. master>`
- Default PR base branch: `<fill_me — e.g. master>`
- Commit message convention: `<fill_me — Conventional Commits + DCO Signed-off-by>`

## Useful plugin Skills

- `runtime-commands-containers` skill
- `node-npm-container-only` skill
- `verify-slice-runbook` skill
- `playwright-runner-docs-gate` skill
- `native-expo-doctor-pre-push` skill (native hoist surface)
- `tamagui-cli-check` skill
- `monorepo-lockfile-gate` skill
- `typescript-bugbot-review` skill (when `.cursor/BUGBOT.md` adopted)
- `ci-watch-loop` skill (umbraculum-toolset-common; when `.cursor/LOOP.md` adopted)

## Useful plugin Agents

- `verifier` agent
- `e2e-smoke` agent
- `contracts-zod-auditor` agent

## Bugbot (only if project adopted `.cursor/BUGBOT.md`)

- Cloud trigger: manual only (`bugbot run` on PR); dashboard "run only when mentioned"
- Autofix: OFF
- Default PR base for local review: `<fill_me>` (example: `master`)
- Review template: `umbraculum-node-react-cursor-assistant` `docs/templates/BUGBOT.md`

## Loop (only if project adopted `.cursor/LOOP.md`)

- CI watch: read-only `/loop` or `ci-watch-loop` skill (umbraculum-toolset-common); interval ≥ 5m
- Default PR base: `<fill_me>` (example: `master`)
- Policy template: `umbraculum-toolset-common` `docs/templates/LOOP.md`

## Project notes

- `<fill_me>`
