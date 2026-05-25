---
name: runtime-commands-containers
description: Use this when you need to suggest or run runtime commands in a containerized repo (Magento/PHP, Node, E2E).
---

# Skill: Runtime commands safety (containers)

Use this when you need to suggest or run runtime commands in a containerized repo (Magento/PHP, Node, E2E).

## Inputs required (do not assume)
- `<PHP_CONTAINER>`
- `<REPO_WORKDIR_IN_CONTAINER>` (example: `/app`)
- Optional: `<NODE_CONTAINER>` (if frontend builds apply)
- Optional: `<E2E_API_CONTAINER>` (if E2E applies)
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
- Composer must run **inside** the PHP container (never probe host composer).

## Commands (templates)
1) Confirm `<PHP_CONTAINER>` and `<REPO_WORKDIR_IN_CONTAINER>`.
2) If composer is needed and not found, look for Composer under `/app/bin/` (examples: `/app/bin/composer2`, `/app/bin/composer22`, `/app/bin/composer28`).
3) If Magento Cloud metapackage is present and composer install/update ran successfully, run `./vendor/bin/ece-patches apply` inside the PHP container.
4) For `m2-hotfixes/*.patch`, generate patches via real diffs and validate inside the PHP container with `./vendor/bin/ece-patches apply`.
5) For integration tests, use `INTEGRATION_TESTS_*` env vars and verify DB connectivity (`SELECT 1`) before launching PHPUnit.

## Stop conditions
- Any of `<PHP_CONTAINER>` / `<REPO_WORKDIR_IN_CONTAINER>` is unknown or ambiguous.
- Command execution requires allowlist/approval and is blocked.
- A step would require destructive host operations or guessing mounts/compose file selection.
