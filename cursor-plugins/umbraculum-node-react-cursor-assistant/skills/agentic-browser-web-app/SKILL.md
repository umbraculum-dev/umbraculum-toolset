---
name: agentic-browser-web-app
description: Use this when you need to drive an integrated browser (e.g. Cursor's browser tools / use_browser) against a running TS/JS web app for **exploratory** or **on...
---

# Skill: Agentic browser E2E for TS/JS web apps

Use this when you need to drive an integrated browser (e.g. Cursor's browser tools / `use_browser`) against a running TS/JS web app for **exploratory** or **on-demand** E2E checks — separate from the deterministic Playwright (or equivalent) suite.

This skill is the **sibling** of `agentic-e2e-runbook` skill:
- `agentic-e2e-runbook` skill: control-panel CLI-driven E2E (`run agentic ...`).
- **this skill**: agent-driven integrated browser jobs against a TS/JS web app.

Treat agentic browser runs as **signal-only** unless your team explicitly makes them gating. Gate them behind deterministic L1–L5 layers (see `20-tests-must-follow-changes.mdc` and the project's `docs/TESTING.md`).

## Inputs required (do not assume)
- `<APP_BASE_URL>`: base URL of the web app under test (example: `http://localhost:18080`).
- `<PERSONA_EMAIL>`, `<PERSONA_PASSWORD>`: credentials for a single seeded E2E persona.
- `<FIXTURE_FILE>`: path to a JSON/TS fixture file enumerating personas + seeded entity IDs (example: `apps/web/e2e/personas.json`). The project owns this; do not invent IDs.
- `<JOB>`: a single job ID, camelCase (example: `agenticCreateRecipe`). The project's `docs/agentic-jobs.md` (or equivalent) lists the available jobs and their steps; do not invent a job.
- `<RUN_DIR_ROOT>` (optional): output root. Recommended default: `var/test-runs/`.
- `<MCP_BASE_URL>` (optional): if a project-local test-MCP server is running (see `test-mcp-server` skill), use it for the `loginAs` shortcut. Default `http://localhost:8932`.

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands per job invocation.
- One persona, one job, one run. No loops over personas/locales/sites.
- No speculative selectors; reuse the project's Playwright locator helpers when a deterministic spec already covers the same screen.
- No full HTML/JSON/screenshot dumps in chat. Reference paths under `<RUN_DIR_ROOT>` instead.
- Never modify `docker-compose.yml`, runner configuration, or the project's E2E suite codebase to "fix" the stack. If the stack is broken, ask the developer.
- Treat the run as **signal-only** unless the project marks it gating.

## Prerequisites
- Stack is up and healthy (`docker compose ps` or equivalent shows the expected services).
- Project smoke is green for `<APP_BASE_URL>` (project-defined; commonly `./scripts/smoke.sh <APP_BASE_URL>` exit 0).
- E2E fixture is seeded (project-defined; commonly `npm run seed:e2e` against the test DB) and `<FIXTURE_FILE>` is in sync with the seeder.
- `<JOB>` exists in the project's `docs/agentic-jobs.md`; required steps are documented; do not improvise.
- (Optional) project-local test-MCP server is reachable at `<MCP_BASE_URL>`.

## Commands (templates)
1) Confirm app reachable: `curl -fsS <APP_BASE_URL>/api/health` (or the project's equivalent health endpoint).
2) Smoke gate (project-defined): `./scripts/smoke.sh <APP_BASE_URL>` (or equivalent).
3) (Optional) prime auth via test-MCP: `curl -fsS -X POST <MCP_BASE_URL>/loginAs -H 'content-type: application/json' --data '{"persona":"<PERSONA_KEY>"}'`. Capture the returned cookie/token (do not log values; reference the response path only).
4) Open `<APP_BASE_URL>` in the integrated browser; sign in as `<PERSONA_EMAIL>`; execute `<JOB>` per its definition in the project's `docs/agentic-jobs.md`.
5) Write artifacts to `<RUN_DIR_ROOT>/<UTC_TIMESTAMP>-<JOB>/`; write `verdict.txt`; return a one-line summary to chat referencing the run dir.

## Stop conditions
- Smoke fails: stop, do not enter the browser. Triage smoke first.
- Stack returns 502/500 after one retry: stop and follow the project's "stack broken" runbook.
- UI hangs > 30 seconds on any step: stop, screenshot, write `verdict.txt = "hang"`, exit.
- A required selector resolves to zero or multiple elements (ambiguity): stop and write `verdict.txt = "ambiguous"` — do not guess.
- After one full job run: stop. Do not loop. Re-invocation is the user's choice.
- Any required input (`<APP_BASE_URL>`, `<PERSONA_*>`, `<FIXTURE_FILE>`, `<JOB>`) is missing or ambiguous: stop and ask.

## Run-dir layout (mandatory)

```
<RUN_DIR_ROOT>/<UTC_TIMESTAMP>-<JOB>/
  verdict.txt        # one line: "pass" | "fail: <reason>" | "hang" | "ambiguous"
  events.ndjson      # one JSON object per line: step name, timestamp, status, optional ref to artifact
  screenshots/       # bounded set; named with monotonic prefix (01-*, 02-*, ...)
  cleanup.txt        # OPTIONAL: IDs/paths the next run (or a follow-up tool) should delete
```

If `verdict.txt` is missing after the run, the parent agent MUST treat the run as `fail: missing verdict`.

## Where the actual jobs live

Upstream this skill is **deliberately empty of jobs**. Each adopting project defines its `<JOB>` catalog in:

- `docs/agentic-jobs.md` (recommended), or
- a `## Agentic jobs` section inside `docs/TESTING.md`, or
- a `DEVELOPMENT-LOCAL.md` "Agentic jobs" section.

Each job entry SHOULD describe:
- **Goal** (one sentence).
- **Deterministic counterpart** (link to the Playwright/equivalent spec that locks in the same flow).
- **Steps the agent should take** (numbered; max ~6).
- **Pass criteria** (what makes `verdict.txt = "pass"`).
- **Cleanup** (UI action, or note for `cleanup.txt`).

## "What to do when..."
- Login form rejected the persona password: re-run the project's `seed:e2e` (passwords may have rotated via env vars).
- A seeded fixture (recipe/order/document/etc.) is missing in the UI: re-run `seed:e2e`.
- A computed/derived value renders `NaN` / `--` / `null`: the backend likely failed; check the relevant service logs before retrying. Do not retry blindly.
- Page hangs: stop the run, write `verdict.txt = "hang"`, attach the last screenshot path to the chat output, and let the developer triage.
