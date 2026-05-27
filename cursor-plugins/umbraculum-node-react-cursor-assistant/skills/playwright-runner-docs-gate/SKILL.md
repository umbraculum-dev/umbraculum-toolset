---
name: playwright-runner-docs-gate
description: Use when working on Playwright E2E (apps/web/e2e or e2e/playwright), debugging failures, or running smoke/export suites. Requires quick gates before any playwright test invocation.
---

# Skill: Playwright runner docs gate + quick gates + trace viewer

Use when working on Playwright E2E tests, helpers, configs, debugging, or running suites.

**Repo layouts (detect; do not assume):**

| Layout | Suite root | Primary README |
|---|---|---|
| Umbraculum monorepo | `apps/web/e2e/` | `apps/web/e2e/README.md` |
| Magento / legacy | `e2e/playwright/` | `e2e/playwright/README-maintainers.md` |

Also read when present: `docs/TESTING.md` § L5 (platform test layers). MRP/CRP export smoke: `docs/design/mrp-crp-alpha-demo-walkthrough.md` § Quick gates + troubleshooting.

## Inputs required (do not assume)

- `<E2E_BASE_URL>` — default `http://localhost:18080` unless `DEVELOPMENT-LOCAL.md` says otherwise
- `<NGINX_HTTP_PORT>` — when health URLs use a port env (example: `18080`)
- Optional: `<TRACE_ZIP_PATH>` under `test-results/**` or `apps/web/e2e/test-results/**`

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)

- Max **6** commands (gates count as one grouped block).
- No Playwright test invocation until gates pass.
- Do not assume container name for the one-shot Playwright image workflow (host `docker run --network host` is the Umbraculum default).

---

## Step 0 — Quick gates before Playwright (mandatory)

Run from **repo root** in order. **Stop on first failure.** Do not run `npx playwright test` until all pass.

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

**Symptom → fix (common):**

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| API health fails / 502 | api crash, missing workspace deps | `docker compose logs api`; `docker compose exec api npm install`; `docker compose restart api` |
| Login page not 200 | web crash, missing `zod`/packages | `docker compose logs web`; `docker compose exec web npm install`; `docker compose restart web` |
| Sign-in instead of Log out | seed missing or stale `.auth` | `seed:e2e`; `rm -f apps/web/e2e/.auth/*.json` |
| Export never downloads | gotenberg/redis down | `docker compose up -d gotenberg redis` |

Password parity: if api sets `E2E_ADMIN_PASSWORD`, pass the same `-e E2E_ADMIN_PASSWORD=…` into the Playwright `docker run`.

---

## Step 1 — Read project docs

- **Umbraculum:** `apps/web/e2e/README.md` (canonical commands for smoke + export specs).
- **Magento-style:** `e2e/playwright/README-maintainers.md`, `e2e/playwright/README-captcha-todos.md` when present.
- If guidance conflicts, those README files win for E2E tasks.

---

## Step 2 — Run Playwright (Umbraculum one-shot container template)

After gates pass, from repo root (not inside api/web containers):

```bash
docker run --rm --network host \
  -e E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:18080}" \
  -e E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-e2e-admin-pw!}" \
  -v "$PWD/apps/web/e2e:/e2e" -w /e2e \
  mcr.microsoft.com/playwright:v1.60.0-noble \
  bash -lc "npm install --no-audit --no-fund && npx playwright test --project=smoke <optional-spec-path> --workers=1"
```

MRP/CRP export smoke only: `smoke/mrp-crp-export-alpha.spec.ts` (requires gotenberg + redis).

---

## Step 3 — Trace viewer (failed tests)

If a failed test produced `trace.zip` under `test-results/**`:

```bash
docker run --rm --network host \
  -v "$PWD/apps/web/e2e:/e2e" -w /e2e \
  mcr.microsoft.com/playwright:v1.60.0-noble \
  npx playwright show-trace --host 0.0.0.0 --port 9324 test-results/<...>/trace.zip
```

Open from host: `http://localhost:9324` (change port if busy).

Magento layout: adjust volume mount to `e2e/playwright` and paths under that tree.

---

## Stop conditions

- Any quick gate failed — **do not** run Playwright; fix stack first.
- Suite README path unknown for this repo layout.
- `<E2E_BASE_URL>` / compose service names ambiguous and `DEVELOPMENT-LOCAL.md` missing.
- Trace path unknown and no failed test output provided.
