---
name: api-integration-tests-pre-push
description: Reproduce the GHA api workflow (vitest + REDIS_URL + BullMQ) before pushing changes under services/api or API boot paths. Use proactively when editing services/api/**, services/api/src/tests/**, buildApp(), or packages consumed by the api vitest suite — verify:pre-push / ci-parity typecheck alone does NOT run this job. See rule 75-api-integration-pre-push-gate.mdc.
---

# Skill: API integration tests — pre-push parity (umbraculum-class monorepos)

## Why this skill exists

`npm run verify:pre-push` (T2-PR / skill **`path-aware-pre-push`**) covers **static analysis** (path-resolved ci-parity jobs: docs, lint, typecheck, …) and may start this skill as a native companion when `api.yml` paths match. The separate GHA **`api`** workflow runs **`npm test`** in `services/api` with **Postgres, Redis, and Gotenberg** service containers and `REDIS_URL` set (BullMQ / rendering queue boots via ioredis).

Local gaps this skill closes:

| Missed locally | CI symptom | Example (F-mod 2026-05) |
|---|---|---|
| TS errors in test files | `typecheck` FAIL | `RegisteredModuleSnapshot` has no `aiPrompts` — caught by T2-PR / ci-parity **if run** |
| Vitest **unhandled rejections** after all tests pass | `api-integration-tests` FAIL, exit 1, "Tests passed" + "Errors: 1" | ioredis `Connection is closed` on `app.close()` when `REDIS_URL` set |
| Stale bind-mounted `node_modules` | intermittent | compose exec green, CI red |

**T2 API gate:** this skill is the **API integration** complement to T2-PR static analysis. **T1** scoped vitest (`verify-slice-runbook`, `npm run verify:openapi`) does **not** substitute for this skill before push. See [`docs/VERIFICATION-TIERS.md`](../../umbraculum-dev/docs/VERIFICATION-TIERS.md) in umbraculum-dev.

**Do not double-run vitest:** when the latest `npm run verify:pre-push` / VERIFY-SLICE line for this commit already shows **`api=OK`**, the T2 native companion already ran the same suite — **skip** step 2 and emit `vitest=SKIPPED (reason: t2-api-companion-ok)`. Run step 2 only when API paths are in scope **and** T2 did not run (or did not report) the api companion.

## Inputs required (do not assume)

- `<REPO_ROOT>` — absolute path to the monorepo root (e.g. `/path/to/umbraculum-dev`).
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
API-INTEGRATION-PRE-PUSH <commit-sha>: vitest=<OK|FAIL|SKIPPED> unhandled_errors=<0|N|n/a>
```

If SKIPPED, append `(reason: t2-api-companion-ok)` or `(reason: docs-only)`. If FAIL, append up to 3 lines from vitest output (include **Unhandled Errors** section if present).

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

### 1. Static analysis first (T2-PR — path-aware)

If `<REPO_ROOT>/.umbraculum/ci-parity.json` exists and T2-PR has not already been green on this commit:

```bash
cd <REPO_ROOT> && npm run verify:pre-push
```

Prefer skill **`path-aware-pre-push`**. Do **not** treat bare `npx @umbraculum/ci-parity … --jobs typecheck` as the sole tier‑1 push gate. Skip step 1 when VERIFY-SLICE / `verify:pre-push` is already green on this commit (including when you are only filling the API gap after a T2 run that reported `api=SKIPPED` / no api companion).

### 2. Integration suite (mirrors `.github/workflows/api.yml` `api-integration-tests`)

**Skip when** the latest VERIFY-SLICE / `verify:pre-push` summary for this commit already includes **`api=OK`**. Emit:

```
API-INTEGRATION-PRE-PUSH <commit-sha>: vitest=SKIPPED unhandled_errors=n/a (reason: t2-api-companion-ok)
```

and stop (do not re-run compose vitest).

Otherwise ensure backing services are up, then run the full vitest suite **with Redis** (matches CI `REDIS_URL`):

```bash
cd <REPO_ROOT> && docker compose up -d postgres redis gotenberg
cd <REPO_ROOT> && docker compose exec -T api sh -c 'cd /app && npm install --no-audit --no-fund && npm test'
```

**Pass criteria:** exit code `0` **and** vitest summary shows **no** `Unhandled Errors` / `Errors: N error` block. "Test Files X passed" alone is **not** sufficient.

### 3. Optional narrow rerun (after fixing one test file)

```bash
cd <REPO_ROOT> && docker compose exec -T api sh -c 'cd /app && ./node_modules/.bin/vitest run src/tests/<file>.test.ts'
```

Still require step 2 green (or skipped via `t2-api-companion-ok`) before push unless only that file changed.

## Stop conditions

- Change set is docs-only / no API path → skip step 2; T2-PR docs job may suffice.
- Latest T2-PR on this commit already reports **`api=OK`** → skip step 2 (`t2-api-companion-ok`); do not duplicate vitest.
- `docker compose exec api` unavailable → halt; do not run host `npm test`.
- Vitest reports **Tests passed** but **Errors: 1+ unhandled** → treat as **FAIL** (same as CI); fix teardown (e.g. unset `REDIS_URL` in profile-only tests, await queue `close()` on `app.close()`).
- `verify:pre-push` / T2-PR FAIL → fix before step 2.

## Test-authoring notes (API boot / module profile)

When adding tests that call `buildApp()` multiple times per file:

- Prefer **disabling BullMQ** for tests that only assert route registration: save/delete `REDIS_URL` in `beforeAll`/`afterAll`, or set `RENDERING_WORKER_DISABLED=1`.
- Do not reference fields absent from **`RegisteredModuleSnapshot`** — use registry helpers (`collectModulePromptOverlayTexts`, `listRegisteredModules`) instead of snapshot fields that are not exported.
- Read types from `@umbraculum/module-sdk` / `tsc --noEmit`; compose exec alone will not catch TS errors in test files if `node_modules` is stale.

## Local-subagent-future readiness

Input-driven (`<REPO_ROOT>`, optional workspace/compose names), output-constrained (Prerequisites / Commands / Stop conditions / Result), bounded (≤5 commands). Suitable for a future `api-integration-pre-push` subagent or operator `/api-pre-push` alias.
