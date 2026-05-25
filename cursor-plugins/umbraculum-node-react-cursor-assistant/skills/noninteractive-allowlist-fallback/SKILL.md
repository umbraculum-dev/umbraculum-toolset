---
name: noninteractive-allowlist-fallback
description: Use this when terminal commands are blocked by an allowlist/approval gate and you need to keep unattended work moving.
---

# Skill: Non-interactive allowlist fallback (prefer workspace edits)

Use this when terminal commands are blocked by an allowlist/approval gate and you need to keep unattended work moving.

## Inputs required (do not assume)
- Optional: `<PHP_CONTAINER>` (if container commands are required)
- Optional: `<E2E_API_CONTAINER>` (if E2E CLI is required)
- The exact blocked command(s), if already known

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- Prefer workspace edits over shell-based file writes.
- If blocked, do not retry repeatedly; report exact blocked command(s).

## Prerequisites
- Prefer workspace file edits (editor/apply_patch) over shell-based file writes.
- Use `docker exec` only when unavoidable (Magento CLI, PHPUnit, curls, cache flush, E2E CLI).

## Commands
1) Switch the plan to workspace edits for any file changes.
2) If container-side execution is required, reduce to the minimal stable command set.
3) If a command is blocked, report the exact command(s) and stop.

## Stop conditions
- A required terminal command is blocked and cannot proceed without allowlist/approval.
- Container name(s) are ambiguous for required runtime commands.
