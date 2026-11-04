---
name: playwright-runner-docs-gate
description: Use when working on Playwright E2E (apps/web/e2e), debugging failures, or running smoke/export suites. Requires quick gates before any playwright test invocation.
---

# Skill: Playwright runner docs gate + quick gates + trace viewer

Use when working on Playwright E2E tests, helpers, configs, debugging, or running suites in a **TS/JS** monorepo.

**Canonical layout (umbraculum-class):** suite root `apps/web/e2e/`, primary README `apps/web/e2e/README.md`. Also read when present: `docs/TESTING.md` § L5. MRP/CRP export smoke: `docs/design/mrp-crp-alpha-demo-walkthrough.md` § Quick gates + troubleshooting.

If a consumer repo uses a different Playwright root, read that project's E2E README from `DEVELOPMENT.md` / `DEVELOPMENT-LOCAL.md` — do not invent alternate suite paths.

## Inputs required (do not assume)

- `<E2E_BASE_URL>` — from `DEVELOPMENT-LOCAL.md` / project E2E README (umbraculum-class default often `http://localhost:18080`)
- `<COMPOSE_SERVICES>` — services required before E2E (from project docs; do not invent)
- `<HEALTH_URL>` / `<LOGIN_URL>` — stack health + login (or equivalent) probes from project docs
- Optional: `<SEED_CMD>` — seed/fixture command from project E2E README
- Optional: `<TRACE_ZIP_PATH>` under the suite `test-results/**`

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)

- Max **6** commands (gates count as one grouped block).
- No Playwright test invocation until gates pass.
- Do not assume container name for the one-shot Playwright image workflow (host `docker run --network host` is a common pattern).

---

## Step 0 — Quick gates before Playwright (mandatory)

Run from **repo root** in order. **Stop on first failure.** Do not run `npx playwright test` until all pass.

**Resolve gate commands from project docs** (`DEVELOPMENT-LOCAL.md`, E2E README, `docs/TESTING.md`). Typical shape:

1. Bring up required compose services (`<COMPOSE_SERVICES>`).
2. Run the project smoke script if one exists (e.g. `./scripts/smoke.sh`).
3. Curl `<HEALTH_URL>` and `<LOGIN_URL>` (or project equivalents) for expected status/body.
4. Run `<SEED_CMD>` when the suite requires seeded personas/fixtures.
5. After stack recovery, clear stale Playwright storage only at the path the project documents.

### Umbraculum-class example (only when that layout applies)

```bash
docker compose up -d api web gotenberg redis   # omit gotenberg/redis if spec has no render jobs
./scripts/smoke.sh
curl -sf "${E2E_BASE_URL:-http://localhost:18080}/api/health" | grep -q '"ok":true' \
  || { echo "FAIL: API unhealthy (often 502)"; exit 1; }
curl -sf -o /dev/null -w '%{http_code}\n' "${E2E_BASE_URL:-http://localhost:18080}/en/login" | grep -q '^200$' \
  || { echo "FAIL: web login not 200 (often 500)"; exit 1; }
docker compose exec api npm run seed:e2e
# After stack recovery, clear stale Playwright storage (Umbraculum layout):
# rm -f apps/web/e2e/.auth/e2e-admin.json
```

**Symptom → fix (umbraculum-class):**

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| API health fails / 502 | api crash, missing workspace deps | `docker compose logs api`; `docker compose exec api npm install`; `docker compose restart api` |
| Login page not 200 | web crash, missing `zod`/packages | `docker compose logs web`; `docker compose exec web npm install`; `docker compose restart web` |
| Sign-in instead of Log out | seed missing or stale `.auth` | `seed:e2e`; `rm -f apps/web/e2e/.auth/*.json` |
| Export never downloads | gotenberg/redis down | `docker compose up -d gotenberg redis` |

Password parity: if api sets `E2E_ADMIN_PASSWORD`, pass the same `-e E2E_ADMIN_PASSWORD=…` into the Playwright `docker run`.

---

## Step 1 — Read project docs

- Project E2E README (umbraculum-class: `apps/web/e2e/README.md`).
- If guidance conflicts, that README wins for E2E tasks.

---

## Step 2 — Run Playwright (one-shot container template)

After gates pass, from repo root (not inside api/web containers). Adjust mount/`-w` to the suite root from project docs.

Umbraculum-class example:

```bash
docker run --rm --network host \
  -e E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:18080}" \
  -e E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-e2e-admin-pw!}" \
  -v "$PWD/apps/web/e2e:/e2e" -w /e2e \
  mcr.microsoft.com/playwright:v1.60.0-noble \
  bash -lc "npm install --no-audit --no-fund && npx playwright test --project=smoke <optional-spec-path> --workers=1"
```

MRP/CRP export smoke only (umbraculum-class): `smoke/mrp-crp-export-alpha.spec.ts` (requires gotenberg + redis).

---

## Step 3 — Trace viewer (failed tests)

If a failed test produced `trace.zip` under the suite `test-results/**` (umbraculum-class: `apps/web/e2e/test-results/**`):

```bash
docker run --rm --network host \
  -v "$PWD/apps/web/e2e:/e2e" -w /e2e \
  mcr.microsoft.com/playwright:v1.60.0-noble \
  npx playwright show-trace --host 0.0.0.0 --port 9324 test-results/<...>/trace.zip
```

Open from host: `http://localhost:9324` (change port if busy). Adapt the volume mount when the suite root differs.

---

## Stop conditions

- Any quick gate failed — **do not** run Playwright; fix stack first.
- Suite README path / gate commands unknown for this repo.
- `<E2E_BASE_URL>` / compose service names ambiguous and `DEVELOPMENT-LOCAL.md` missing.
- Trace path unknown and no failed test output provided.
