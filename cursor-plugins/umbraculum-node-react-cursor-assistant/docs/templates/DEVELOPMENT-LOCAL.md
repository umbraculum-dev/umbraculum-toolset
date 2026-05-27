# DEVELOPMENT-LOCAL.md (optional per-developer project context)

This file is per-developer (typically gitignored) and is not synced by the plugin.

If this file exists at repo root, the Cursor assistant plugin reads it early and treats it as project-specific context. If it does not exist, the assistant proceeds normally and asks for missing values only when a task requires them.

You can either hand-write this file using the template below, or ask the agent to generate it for you from your project's `DEVELOPMENT.md` (e.g. "create my DEVELOPMENT-LOCAL.md"). The agent will then invoke the `generate-development-local` skill — it reads `DEVELOPMENT.md`, reads `DEVELOPMENT-LOCAL-OLLAMA.md` if present, fills in everything it can derive, and asks you for the remaining `<fill_me>` values.

Sibling, project-versioned addendum: if your project also commits a `DEVELOPMENT-LOCAL-OLLAMA.md` at repo root (the local-model-runtime addendum — Ollama model id, endpoint URL, `.local.md` agent/subagent variants in use), the assistant reads it alongside this file at session start. That file is project-versioned (lives in the project's main repo); this file is per-developer.

Keep this file short and high-signal. Put reusable procedures in plugin Skills instead of duplicating long runbooks here.

## Project summary

- Project type: `<fill_me>`
- Main stack: `<fill_me>`
- Important docs:
  - `<path/to/project-doc.md>`

## Canonical locations (examples only)

- Canonical repo root: `/path/to/project`
- Cursor worktree root (if applicable): `/path/to/cursor-worktree`
- Runtime/container workdir (if applicable): `/app`

## Containers / services (fill in; do not assume)

- `<PHP_CONTAINER>`: `<fill_me>`
- `<NODE_CONTAINER>`: `<fill_me>`
- `<E2E_API_CONTAINER>`: `<fill_me>`
- `<DB_CONTAINER>`: `<fill_me>`

## Local stack notes

- Local base URL: `<fill_me>`
- Known slow commands / expected timeouts:
  - `<fill_me>`
- Commands that require confirmation before running:
  - `<fill_me>`
- Commands that are forbidden in this project:
  - `<fill_me>`

## E2E defaults (only if stable for this project)

- `<E2E_BASE_URL>`: `<fill_me>` (example: `http://localhost:18080`)
- `<ORG>`: `<fill_me>`
- `<ENV>`: `<fill_me>`
- `<SITES>`: `<fill_me>`
- `<PERSONAS>`: `<fill_me>`

Playwright: before any suite run, agents must execute the **quick gates** in `playwright-runner-docs-gate` skill (stack up, `./scripts/smoke.sh`, `/api/health`, login page 200, `seed:e2e`). Umbraculum-dev canonical copy: `apps/web/e2e/README.md` + `docs/TESTING.md` § L5.

## Protected branches / Git conventions

- Protected branches: `<fill_me>`
- Default PR base branch: `<fill_me>`
- Commit message convention: `<fill_me>`

## Useful plugin Skills

- `runtime-commands-containers` skill
- `docker-compose-debugging` skill
- `curl-exception-verification` skill
- `node-npm-container-only` skill
- `playwright-runner-docs-gate` skill
- `phpunit-unit-runbook` skill
- `magento-integration-tests-runbook` skill

## Useful plugin Agents

- `verifier` agent
- `magento-debugger` agent
- `phpunit-runner` agent
- `template-refactor-verifier` agent
- `e2e-smoke` agent

## Project notes

- `<fill_me>`
