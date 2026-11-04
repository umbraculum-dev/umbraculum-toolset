---
name: cursor-tmp-scripts-and-logs
description: Use this when generating small helper scripts (one-off transforms, inspection scripts) and you want a robust workflow in containerized TS/JS repos.
---

# Skill: Cursor temp scripts + ad-hoc logs (container-friendly)

Use this when generating small helper scripts (one-off transforms, inspection scripts) and you want a robust workflow in containerized repos.

## Inputs required (do not assume)
- `<APP_CONTAINER>` — compose service / container that can run the script (e.g. `api`, `web`)
- `<REPO_WORKDIR_IN_CONTAINER>` (example: `/repo`, `/app`)
- `<PURPOSE>` (short identifier for the script/log)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- Use bounded output/logging; avoid dumping large JSON/logs to chat.
- Prefer not writing ad-hoc logs under `.cursor/` if possible.

## Prerequisites
- Decide the script purpose/name (`<PURPOSE>`).
- Prefer container execution for runtime scripts; workspace writes are ok if bind-mounted.

## Commands (templates)
1) Write the script under a temp scripts folder under the repo (example host: `.tmp/cursor/`; example container: `<REPO_WORKDIR_IN_CONTAINER>/.tmp/cursor/` — do not invent Magento `var/tmp` layouts).
2) Create both a stable “latest” file and a timestamped copy (examples: `.tmp/cursor/<PURPOSE>_latest.mjs`, `.tmp/cursor/<PURPOSE>_<YYYYmmdd_HHMMSS>.mjs`).
3) Run inside `<APP_CONTAINER>` with a timeout (example: `timeout 30m ...`).
4) Write ad-hoc logs under `.tmp/cursor/log/` (host and bind-mounted container path).

## Stop conditions
- `<APP_CONTAINER>` is unknown/ambiguous.
- Any required runtime command is blocked by allowlist/approval.
