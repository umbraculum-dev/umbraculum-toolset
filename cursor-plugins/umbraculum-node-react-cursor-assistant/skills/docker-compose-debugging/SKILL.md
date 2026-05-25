---
name: docker-compose-debugging
description: Use this when diagnosing confusing Docker Compose errors (especially interpolation/parse issues).
---

# Skill: Docker Compose debugging (implementation + file selection first)

Use this when diagnosing confusing Docker Compose errors (especially interpolation/parse issues).

## Inputs required (do not assume)
- The exact compose command that failed
- `pwd`
- Compose implementation/version (`docker compose version` or `docker-compose --version`)
- Which compose file(s) are in play (`-f` flags, current directory, any `.env`)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- Do not propose YAML changes until preflight is done.
- Keep outputs bounded (small excerpts, not full config dumps).

## Prerequisites
- Confirm whether the user is using Compose v2 (`docker compose`) vs legacy v1 (`docker-compose`).
- Confirm which compose file(s) and env var sources are being used.

## Commands
1) Ask for the exact command that was run and `pwd`.
2) Ask for `docker compose version` (or `docker-compose --version`).
3) Ask which compose file(s) are in play (`-f` flags) and whether a `.env` file is used.
4) Optional: request a small `docker compose config` excerpt for the affected service/key (resolved interpolation).
5) Only then suggest minimal YAML/env fixes targeting the confirmed compose file.

## Stop conditions
- Compose file selection is ambiguous.
- Required diagnostics are blocked by allowlist/approval.
