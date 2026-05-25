---
name: cursor-tmp-scripts-and-logs
description: Use this when generating small helper scripts (one-off transforms, inspection scripts) and you want a robust workflow in containerized repos.
---

# Skill: Cursor temp scripts + ad-hoc logs (container-friendly)

Use this when generating small helper scripts (one-off transforms, inspection scripts) and you want a robust workflow in containerized repos.

## Inputs required (do not assume)
- `<PHP_CONTAINER>`
- `<REPO_WORKDIR_IN_CONTAINER>` (example: `/app`)
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
1) Write the script under a temp scripts folder (example host: `html/var/tmp/cursor/`; example container: `/app/var/tmp/cursor/`).
2) Create both a stable “latest” file and a timestamped copy (examples: `/app/var/tmp/cursor/<PURPOSE>_latest.py`, `/app/var/tmp/cursor/<PURPOSE>_<YYYYmmdd_HHMMSS>.py`).
3) Run inside `<PHP_CONTAINER>` with a timeout (example: `timeout 30m ...`).
4) Write ad-hoc logs under an ad-hoc log folder (example host: `html/var/tmp/cursor/log/`; example container: `/app/var/tmp/cursor/log/`).

## Stop conditions
- `<PHP_CONTAINER>` is unknown/ambiguous.
- Any required runtime command is blocked by allowlist/approval.
