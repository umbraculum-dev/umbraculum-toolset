---
name: playwright-runner-docs-gate
description: Use this when working on anything under e2e/playwright/** (tests, helpers, configs, debugging, running suites).
---

# Skill: Playwright runner docs gate + trace viewer

Use this when working on anything under `e2e/playwright/**` (tests, helpers, configs, debugging, running suites).

## Inputs required (do not assume)
- `<PLAYWRIGHT_CONTAINER>` (the container used to run Playwright commands)
- Optional: `<TRACE_ZIP_PATH>` (relative path under `e2e/playwright/test-results/**`)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- Do not assume container name or working directory.

## Prerequisites
- Always read:
  - `e2e/playwright/README-maintainers.md`
  - `e2e/playwright/README-captcha-todos.md`
- If guidance conflicts with other assumptions, those README files win for E2E tasks.

## Trace viewer (for failed tests)
If a failed test produced a `trace.zip` under `e2e/playwright/test-results/**`, propose the trace viewer command using the container workflow.

## Commands (templates)
1) Confirm `<PLAYWRIGHT_CONTAINER>` and the working directory (example: `/app/e2e/playwright`).
2) Use this exact wording: “run from the playwright container from `/app/e2e/playwright`”.
3) Prefer server mode:

```bash
npx playwright show-trace --host 0.0.0.0 --port 9324 test-results/<...>/trace.zip
```

4) Then open from host: `http://localhost:9324` (use another port if busy).

## Stop conditions
- `<PLAYWRIGHT_CONTAINER>` is unknown/ambiguous.
- The trace path is unknown and no failed test output is provided.
