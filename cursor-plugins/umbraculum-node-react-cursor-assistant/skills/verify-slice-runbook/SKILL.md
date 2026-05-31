---
name: verify-slice-runbook
description: Run T0 or T1 verification for a named slice or git diff via scripts/verify-slice.sh. Use proactively after non-doc TS edits in umbraculum-dev before declaring done — maps change surface to minimum effective proof. See docs/VERIFICATION-TIERS.md and rule 76-verification-tiers-gate.
---

# Skill: Verify slice runbook (T0 / T1)

## Why this skill exists

Agents and humans need one command per change theme instead of improvising docker/npm sequences. Umbraculum-dev ships **`scripts/verify-slice.sh`** backed by **`.umbraculum/verification-slices.json`**.

T2 (ci-parity + API integration) uses **`npm run verify:pre-push`** / skills **`ci-parity-local-reproduction`** + **`api-integration-tests-pre-push`** — not this skill.

## Inputs required (do not assume)

- `<REPO_ROOT>` — absolute monorepo root.
- `<TIER>` — `T0` or `T1` (this skill does not run T2).
- `<SLICE>` — named slice (`openapi`, `contracts`, `api-platform`, …) **or** `--from-diff`.
- `<BASE_REF>` — default `main` when using `--from-diff`.

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

### Result

```
VERIFY-SLICE <TIER> <slice> @ <sha>: step=OK|FAIL ...
```

(Pass through the script's summary line verbatim.)

## Bounds (hard)

- Max **2** commands (one verify-slice invocation; optional follow-up scoped build if slice failed on dist).
- Read-only w.r.t. tracked tree unless a slice step rebuilds `dist/` (expected).
- No host npm except `npx @umbraculum/ci-parity` inside the `docs` slice (T1 only).

## Prerequisites

- `<REPO_ROOT>/scripts/verify-slice.sh` exists.
- For slices using `docker compose exec api …`: stack up (`docker compose up -d api postgres redis gotenberg` as needed).
- Read [`docs/VERIFICATION-TIERS.md`](../../umbraculum-dev/docs/VERIFICATION-TIERS.md) matrix when `<SLICE>` is ambiguous.

## Commands

### Named slice (T1 examples)

```bash
cd <REPO_ROOT> && ./scripts/verify-slice.sh --tier T1 --slice openapi
cd <REPO_ROOT> && ./scripts/verify-slice.sh --tier T1 --slice contracts
cd <REPO_ROOT> && npm run verify:from-diff
```

### Auto-routing from diff

```bash
cd <REPO_ROOT> && ./scripts/verify-slice.sh --tier T1 --from-diff <BASE_REF>
```

### T0 fast loop

```bash
cd <REPO_ROOT> && ./scripts/verify-slice.sh --tier T0 --slice openapi
```

## Stop conditions

- Script missing → halt; list manual commands from `docs/VERIFICATION-TIERS.md`.
- `docker compose exec api` fails (container down) → start stack; do not run host vitest.
- Any step `FAIL` in summary → do not declare done; fix and re-run same tier.

## Slice quick-reference

| Change | Slice |
|--------|-------|
| `packages/contracts/src/**` | `contracts` |
| API routes / OpenAPI | `openapi` |
| `auth.ts`, `workspaces.ts` | `api-platform` |
| Brewery batch routes | `api-brewery-batch1` |
| `packages/pim-contracts/**` | `packages-pim` |
| Docs only | `docs` |

## Fits the system

Input-driven, output-constrained, bounded. Pairs with **`scoped-package-build-in-docker`** when slice output shows dist drift.
