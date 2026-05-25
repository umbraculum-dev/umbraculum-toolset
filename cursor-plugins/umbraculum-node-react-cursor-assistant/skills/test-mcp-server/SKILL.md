---
name: test-mcp-server
description: A small HTTP server that exposes a project's testing tools as one-call JSON endpoints, so external agents (Cursor, CI scripts, ad-hoc curls) can drive smoke ...
---

# Skill: Project-local test-MCP server (pattern + runbook)

A small HTTP server that exposes a project's testing tools as one-call JSON endpoints, so external agents (Cursor, CI scripts, ad-hoc curls) can drive smoke / seed / unit / integration / contract / Playwright runs without re-implementing project-specific glue.

This is a **pattern**, not a shipped binary. The upstream package describes the protocol and the recommended tool catalog; the **consumer project** owns the implementation (typically `packages/test-mcp/` or similar) and chooses which tools to expose.

Pairs naturally with `agentic-browser-web-app` skill: the agentic-browser skill uses test-MCP for non-UI prerequisites (smoke, seed, `loginAs`) so it can spend its budget on actual browser interaction.

## Inputs required (do not assume)
- `<TEST_MCP_BASE_URL>`: where the project's test-MCP server listens (example: `http://localhost:8932`).
- `<TOOL>`: one tool name from the project's published catalog (see "Recommended tool catalog" below). Do not call a tool that isn't in the project's `/` discovery response.
- `<ARGS>`: a JSON object for `<TOOL>` per its schema (commonly visible at `GET <TEST_MCP_BASE_URL>/`).
- `<RUN_DIR_ROOT>` (optional): output root. Recommended default: `var/test-runs/`.
- `<APP_BASE_URL>` (only for tools that target the running stack, e.g. `smokeStack`, `loginAs`).

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands per invocation.
- No loops or repeated polling.
- Never expose the test-MCP port beyond localhost; the server is unauthenticated by design.
- Never modify `docker-compose.yml`, runner configs, or the test-MCP package itself to "fix" a failing tool from this skill.
- Never dump full stdout/stderr in chat. Reference the `runDir` returned by the response instead.
- Treat tool output as **signal-only** unless the project marks it gating.

## Prerequisites
- Stack is up and healthy (project-defined; commonly `docker compose ps`).
- Test-MCP server is reachable: `curl -fsS <TEST_MCP_BASE_URL>/` returns `{ ok: true, tools: [...] }`.
- `<TOOL>` is present in that `tools[]` list (do not call undeclared tools).
- For tools that depend on the seeder, the project's E2E fixture has been seeded at least once (commonly via the `seedE2eFixture` tool itself).

## Commands (templates)
1) Discover tools: `curl -fsS <TEST_MCP_BASE_URL>/`.
2) Smoke gate (if implemented): `curl -fsS -X POST <TEST_MCP_BASE_URL>/smokeStack -H 'content-type: application/json' --data '{}'`.
3) (Optional) seed fixture (if implemented): `curl -fsS -X POST <TEST_MCP_BASE_URL>/seedE2eFixture -H 'content-type: application/json' --data '{}'`.
4) Invoke target tool: `curl -fsS -X POST <TEST_MCP_BASE_URL>/<TOOL> -H 'content-type: application/json' --data '<ARGS>'`.
5) Read run-dir summary: `curl -fsS "<TEST_MCP_BASE_URL>/lastRunArtifacts?tool=<TOOL>"` and report `verdict.txt` content + run-dir path.

## Stop conditions
- `GET /` does not list `<TOOL>`: stop and surface the available list; do not invoke.
- Smoke fails at step 2: stop. Do not invoke `runPlaywright*` or any tool that assumes a healthy stack.
- The tool response is non-JSON or HTTP >= 400: stop, report the run dir path (if any), do not retry blindly.
- `verdict.txt` is missing in the run dir after invocation: treat as `fail: missing verdict`; surface the run dir path; do not retry.
- After one tool invocation per session: stop. Re-invocation is the user's choice.

## Recommended tool catalog (consumers implement a subset)

Each tool below is **optional**. Consumers expose only the tools they need, but should use these names and the run-dir contract below for cross-project consistency.

| Tool name              | Purpose                                                         | Typical `<ARGS>` shape                  |
|------------------------|-----------------------------------------------------------------|-----------------------------------------|
| `smokeStack`           | Project smoke (health → login → me → logout) against `<APP_BASE_URL>` | `{ "baseUrl": "<APP_BASE_URL>" }`  (optional) |
| `seedE2eFixture`       | Idempotent seed of test personas + fixtures into the test DB    | `{ "clean": false }`                    |
| `runApiTests`          | Run API service unit/integration suite                          | `{}` (or `{ "grep": "..." }`)           |
| `runContractsCheck`    | Run response-shape contract snapshots                           | `{ "update": false }`                   |
| `runPlaywrightSmoke`   | Run the project's Playwright `@smoke` set                       | `{}`                                    |
| `runPlaywrightSpec`    | Run a single Playwright spec by path                            | `{ "spec": "<path>.spec.ts" }`          |
| `loginAs`              | Headless login → returns cookie/storage state for browser reuse | `{ "persona": "<KEY>" }`                |
| `getLastRunArtifacts`  | Locate latest run dir + its `verdict.txt`                       | `{ "tool": "<TOOL>" }`                  |

## Run-dir contract (mandatory across tools)

Every tool that runs a process MUST write to a fresh run dir:

```
<RUN_DIR_ROOT>/<UTC_TIMESTAMP>-<TOOL>/
  verdict.txt        # one line: "pass" | "fail: <reason>"
  stdout.log         # bounded; truncate if huge
  stderr.log         # bounded; truncate if huge
  events.ndjson      # OPTIONAL: structured events for the tool
```

The HTTP response SHOULD include the absolute `runDir` path so the caller can `tail` / read artifacts without scanning.

This layout intentionally matches `agentic-browser-web-app` skill so a parent agent reading "the last run" has a uniform answer regardless of which surface produced it.

## Security note
- The server is **localhost-only** and **unauthenticated** by design — it is a developer/agent productivity tool, not a production interface.
- Never bind to `0.0.0.0` or expose the port through Docker port mapping outside `127.0.0.1`.
- Never accept `<ARGS>` that include arbitrary shell strings; tools should construct argv themselves, not `bash -lc <user_input>`.

## "What to do when..."
- `GET /` succeeds but `<TOOL>` is missing: the project hasn't implemented it. Either implement it in the project's test-MCP package or use a different tool.
- Tool returns 500: read `stderr.log` from the run dir; surface a short excerpt (10–20 lines max) and the run dir path. Do not paste the full log.
- Tool reports `pass` but the underlying suite was empty: check the tool's args (commonly a `grep` filter matched nothing) before celebrating.
