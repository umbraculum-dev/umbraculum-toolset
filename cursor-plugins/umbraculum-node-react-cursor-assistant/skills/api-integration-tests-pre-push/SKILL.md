---
name: api-integration-tests-pre-push
description: Reproduce the GHA api workflow (vitest + REDIS_URL + BullMQ) before pushing changes under services/api or API boot paths. Use proactively when editing services/api/**, services/api/src/tests/**, buildApp(), or packages consumed by the api vitest suite — ci-parity typecheck alone does NOT run this job. See rule 75-api-integration-pre-push-gate.mdc.
---

# Skill: API integration tests — pre-push parity (umbraculum-class monorepos)

## Why this skill exists

`npx @umbraculum/ci-parity` covers **static analysis only** (docs, lint, typecheck). The separate GHA **`api`** workflow runs **`npm test`** in `services/api` with **Postgres, Redis, and Gotenberg** service containers and `REDIS_URL` set (BullMQ / rendering queue boots via ioredis).

Local gaps this skill closes:

| Missed locally | CI symptom | Example (F-mod 2026-05) |
|---|---|---|
| TS errors in test files | `typecheck` FAIL | `RegisteredModuleSnapshot` has no `aiPrompts` — caught by ci-parity **if run** |
| Vitest **unhandled rejections** after all tests pass | `api-integration-tests` FAIL, exit 1, "Tests passed" + "Errors: 1" | ioredis `Connection is closed` on `app.close()` when `REDIS_URL` set |
| Stale bind-mounted `node_modules` | intermittent | compose exec green, CI red |

**T2 API gate:** this skill is the **T2** complement to ci-parity (T2 static). **T1** scoped vitest (`verify-slice-runbook`, `npm run verify:openapi`) does **not** substitute for this skill before push. See [`docs/VERIFICATION-TIERS.md`](../../umbraculum-dev/docs/VERIFICATION-TIERS.md) in umbraculum-dev.

**Both T2 gates:** run **ci-parity** (or `npm run verify:pre-push`) **and** this skill when the change set touches API behavior or API tests.

## Inputs required (do not assume)

- `<REPO_ROOT>` — absolute path to the monorepo root (e.g. `/home/rf/dkprojects/rfapps/umbraculum-dev`).
- `<API_WORKSPACE>` — path to the API service. Default: `services/api`.
- `<COMPOSE_PROJECT>` — docker compose project with `postgres`, `redis`, `gotenberg`, and `api` services. Default: repo-root `docker compose`.

## Output format (return exactly)

### Prerequisites

(confirmed repo root, compose services available, whether change set warrants this gate)

### Commands

(bounded list with exit codes)

### Stop conditions

(`(none triggered)` or specific halt reason)

### Result

```
API-INTEGRATION-PRE-PUSH <commit-sha>: vitest=<OK|FAIL> unhandled_errors=<0|N>
```

If FAIL, append up to 3 lines from vitest output (include **Unhandled Errors** section if present).

## Bounds (hard)

- Max **5** commands.
- All `npm` runs **inside** the `api` container (`node-npm-container-only`).
- No loops; no "push and see what CI says".
- Read-only w.r.t. tracked tree (does not commit).

## Prerequisites

- Change set touches `<API_WORKSPACE>/src/**`, `<API_WORKSPACE>/prisma/**`, or shared packages listed in `.github/workflows/api.yml` path filters.
- Docker Compose stack reachable (`docker compose ps`).
- Committed state reflects what you intend to push (`git archive HEAD` is what CI checks out).

## Commands

### 1. Static analysis first (typecheck — same class of error as CI typecheck job)

If `<REPO_ROOT>/.umbraculum/ci-parity.json` exists:

```bash
cd <REPO_ROOT> && npx @umbraculum/ci-parity@^1 run --jobs typecheck
```

Skip only for docs-only pushes with zero TS surface.

### 2. Integration suite (mirrors `.github/workflows/api.yml` `api-integration-tests`)

Ensure backing services are up, then run the full vitest suite **with Redis** (matches CI `REDIS_URL`):

```bash
cd <REPO_ROOT> && docker compose up -d postgres redis gotenberg
cd <REPO_ROOT> && docker compose exec -T api sh -c 'cd /app && npm install --no-audit --no-fund && npm test'
```

**Pass criteria:** exit code `0` **and** vitest summary shows **no** `Unhandled Errors` / `Errors: N error` block. "Test Files X passed" alone is **not** sufficient.

### 3. Optional narrow rerun (after fixing one test file)

```bash
cd <REPO_ROOT> && docker compose exec -T api sh -c 'cd /app && ./node_modules/.bin/vitest run src/tests/<file>.test.ts'
```

Still require step 2 green before push unless only that file changed.

## Stop conditions

- Change set is docs-only / no API path → skip step 2; ci-parity docs job may suffice.
- `docker compose exec api` unavailable → halt; do not run host `npm test`.
- Vitest reports **Tests passed** but **Errors: 1+ unhandled** → treat as **FAIL** (same as CI); fix teardown (e.g. unset `REDIS_URL` in profile-only tests, await queue `close()` on `app.close()`).
- ci-parity typecheck FAIL → fix before step 2.

## Test-authoring notes (API boot / module profile)

When adding tests that call `buildApp()` multiple times per file:

- Prefer **disabling BullMQ** for tests that only assert route registration: save/delete `REDIS_URL` in `beforeAll`/`afterAll`, or set `RENDERING_WORKER_DISABLED=1`.
- Do not reference fields absent from **`RegisteredModuleSnapshot`** — use registry helpers (`collectModulePromptOverlayTexts`, `listRegisteredModules`) instead of snapshot fields that are not exported.
- Read types from `@umbraculum/module-sdk` / `tsc --noEmit`; compose exec alone will not catch TS errors in test files if `node_modules` is stale.

## Local-subagent-future readiness

Input-driven (`<REPO_ROOT>`, optional workspace/compose names), output-constrained (Prerequisites / Commands / Stop conditions / Result), bounded (≤5 commands). Suitable for a future `api-integration-pre-push` subagent or operator `/api-pre-push` alias.
