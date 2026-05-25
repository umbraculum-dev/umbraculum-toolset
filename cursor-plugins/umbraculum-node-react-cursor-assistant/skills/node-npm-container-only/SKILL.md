---
name: node-npm-container-only
description: Use this when you need to run Node/npm tasks in a containerized project.
---

# Skill: Node/npm container-only execution

Use this when you need to run Node/npm tasks in a containerized project.

## Inputs required (do not assume)
- `<NODE_CONTAINER>`
- `<REPO_WORKDIR_IN_CONTAINER>` (example: `/app`)
- `<NPM_SCRIPT>` (example: `build`, `typecheck`)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- Never run Node/npm on host for containerized repos.
- No speculative container names or working directories.

## Prerequisites
- Confirm the correct Node container for the stack; if ambiguous, ask (do not guess).
- Verify the working directory exists in the container (common examples: `/app`, `/opt/playwright-suite`).

## Commands (templates)
1) Verify `<NODE_CONTAINER>` is the correct container.
2) Run: `docker exec -i <NODE_CONTAINER> bash -lc 'cd <REPO_WORKDIR_IN_CONTAINER> && npm run -s <NPM_SCRIPT>'`.

## Stop conditions
- `<NODE_CONTAINER>` or `<REPO_WORKDIR_IN_CONTAINER>` is unknown/ambiguous.
- The exec command is blocked by allowlist/approval.
