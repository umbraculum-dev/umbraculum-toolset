---
name: agentic-e2e-runbook
description: Use this when you need a **minimal, non-blocking** E2E signal around risky storefront changes (PLP/PDP templates, layered navigation, checkout CSS/JS) via th...
---

# Skill: Agentic E2E runbook (control panel CLI)

Use this when you need a **minimal, non-blocking** E2E signal around risky storefront changes (PLP/PDP templates, layered navigation, checkout CSS/JS) via the control panel CLI.

## Inputs required (do not assume)
- `<E2E_API_CONTAINER>`: the container name running the control panel/API CLI.
- `<ORG>`: org identifier.
- `<ENV>`: environment name (example: `local`).
- `<SITES>`: comma-separated sites list.
- `<PERSONAS>`: comma-separated personas list (example: `guest`).
- `<JOBS>`: comma-separated job IDs (kebab-case, e.g. `plp-smoke`, not `plpSmoke`).

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands (group commands by purpose).
- No loops/polling.
- Keep outputs bounded (extract `run.id` and final status; avoid dumping full JSON).
- Treat as **signal-only** unless your team makes it gating.
- Do not modify the E2E suite codebase unless explicitly requested.

## Prerequisites
- Confirm `<E2E_API_CONTAINER>` and working directory expectations for the E2E stack.
- Confirm `<ORG>`, `<ENV>`, `<SITES>`, `<PERSONAS>`, `<JOBS>` from `DEVELOPMENT-LOCAL.md` or developer input.

## Commands (templates)
1) Enqueue an agentic run (capture `run.id`): use `run agentic ... --json`.
2) Fetch status once (no loops): `runs show ... --json` and extract a tiny summary.
3) Fetch report: `runs report ... --json` (bounded output).
4) Fetch artifacts: `runs artifacts ... --json` (bounded output).
5) Optional deterministic run: `run deterministic ... --includeTags ... --json` (only when relevant).

## Stop conditions
- Any required input is missing or ambiguous (`<E2E_API_CONTAINER>`, `<ORG>`, `<SITES>`, etc.).
- A required command is blocked by allowlist/approval.
- Output would be too large; switch to bounded summaries only.

## What to run (recommended minimal set)

- When working on layered navigation / PLP filters:
  - `plp-filters`
- Generic regression smoke (usually include 1–2):
  - `plp-smoke`
  - `plp-sort`
  - `plp-pagination`
  - `plp-add-to-cart` (optional, useful when touching product-card JS)

## Run: enqueue an agentic job
Example (run from host):

```bash
docker exec -i <E2E_API_CONTAINER> bash -lc \
  'npm run -s cli:dev -- run agentic --org <ORG> --env <ENV> \
   --jobs <JOBS> --sites <SITES> --personas <PERSONAS> --timeout slow --json'
```

Capture the returned `run.id` (a UUID).

## Then: status/report/artifacts
Example commands:

```bash
docker exec -i <E2E_API_CONTAINER> bash -lc \
  'npm run -s cli:dev -- runs show --org <ORG> --runId <RUN_ID> --json'
docker exec -i <E2E_API_CONTAINER> bash -lc \
  'npm run -s cli:dev -- runs report --org <ORG> --runId <RUN_ID> --json'
docker exec -i <E2E_API_CONTAINER> bash -lc \
  'npm run -s cli:dev -- runs artifacts --org <ORG> --runId <RUN_ID> --json'
```

## Deterministic runs (tags, not job ids)

Some stacks expose “deterministic” runs that select Playwright tests by **title tags**.

- `--includeTags` is typically used to build a Playwright `--grep` matching tags embedded in test titles
  (examples: `@flow:checkout`, `@pay:braintree`).
- It is **not** a filename filter and **not** a job identifier.

Example:

```bash
docker exec -i <E2E_API_CONTAINER> bash -lc \
  'npm run -s cli:dev -- run deterministic --org <ORG> --env <ENV> --suite storefront \
   --timeout extra-slow --sites <SITES> --personas <PERSONAS> \
   --includeTags @flow:checkout,@pay:braintree --allowPlaceOrder --json'
```

Narrowing note:
- `--includeTags` can match multiple tests; use `--excludeTags` to keep runs minimal.

## Non-interactive robustness (avoid tool timeouts)

Agentic CLI outputs can be large. Avoid long polling loops and full JSON dumps.

Required strategy:
- Step 1: enqueue with `--json` and capture `run.id`.
- Step 2: do exactly one bounded status fetch (no loops), ideally with a hard timeout.
- Step 3: fetch details only after completion and keep output bounded (paths/counts, not full JSON).

## Logging (required for unattended review)
Log each run to NDJSON (one JSON object per line).

- Example host path: `html/var/tmp/cursor/log/agentic_runs.ndjson`
- Example container path: `/app/var/tmp/cursor/log/agentic_runs.ndjson`

At minimum, append:
- the enqueue JSON (contains `run.id`)
- the final `runs show` JSON (contains `status` / `ok` / `exitCode`)
