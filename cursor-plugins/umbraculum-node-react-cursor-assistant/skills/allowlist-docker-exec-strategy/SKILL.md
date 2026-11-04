---
name: allowlist-docker-exec-strategy
description: Use this when Cursor/agent command approvals (allowlisting) are slowing down container workflows in TS/JS compose stacks.
---

# Skill: Allowlist prompts + `docker exec` strategy (non-interactive)

Use this when Cursor/agent command approvals (allowlisting) are slowing down container workflows.

## Inputs required (do not assume)
- Optional: `<APP_CONTAINER>` (compose service needing exec, e.g. `api`, `web`)
- Optional: `<E2E_RUNNER>` (Playwright one-shot image / host `docker run` shape, if E2E is in scope)
- The exact blocked command(s), if already known

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- No speculative container names or command shapes.
- If blocked, do not retry repeatedly.

## Prerequisites
- Approvals/allowlists are host-side Cursor policy; repo rules cannot force auto-allowlisting.
- Prefer editor-based edits for code changes.

## Commands
1) Identify the minimal set of stable command “shapes” needed for the workflow.
2) Suggest narrow allowlisting for those shapes only (examples: `docker compose exec -T <APP_CONTAINER> …`, `docker run --rm --network host … playwright …`).
3) Batch commands to reduce prompts.

## Stop conditions
- A required command is blocked and cannot proceed without allowlist/approval.
- Container name(s) are ambiguous for required commands.
