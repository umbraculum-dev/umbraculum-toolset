---
name: l2-cross-workspace-isolation-test
description: Scaffold an L2 cross-workspace isolation test for a workspace-scoped route. Use when adding a new workspace-scoped route or when an audit finds an L2 gap on an existing route.
---

# L2 cross-workspace isolation test

Use this skill to author the canonical L2 (route-integration) test pattern for a workspace-scoped route. The pattern is established in 40+ existing test files in services that ship workspace-scoped routes; this skill emits a fresh test file (or a fresh `describe` block) following that pattern, *not* a custom variant.

The 6 axes the canonical pattern covers:

1. **Happy path** — workspace member can read/write their own workspace's row.
2. **Cross-workspace 404** — workspace A's user gets 404 on workspace B's row (NOT 200, NOT 403).
3. **Unauthorized — missing session** — `401` with `missing_session` body code.
4. **Unauthorized — missing active workspace** — `401` with `missing_active_workspace` body code (only if the route requires an active workspace).
5. **Validation 400** — at least one validation-failure axis (invalid body field, wrong-shape input).
6. **Shape pin** — happy-path response shape matches the contract type via Zod-like deep assertion.

## Inputs required (do not assume)

- `<ROUTE_PATH>` (the route under test, e.g. `/api/inventory`)
- `<METHOD>` (HTTP method: `GET` / `POST` / `PATCH` / `DELETE`)
- `<SECOND_PERSONA_ID>` (cross-workspace persona; the project's seed-data persona ID, e.g. `e2e-multi-admin`)
- `<TEST_FILE_PATH>` (where the test should land, e.g. `services/api/src/tests/inventory.test.ts`; if the file exists, append a sibling `describe` block; if not, create the file)
- `<CONTRACT_TYPE_NAME>` (the response-shape contract, e.g. `InventoryItemResponseV1`; resolved from `packages/contracts` for the shape-pin axis)

## Output format (return exactly)

### Prerequisites

(what was inferred from inputs — including whether `<TEST_FILE_PATH>` exists)

### Commands

(the bounded list of commands run, with exit codes)

### Stop conditions

(`(none triggered)` or the specific stop condition met)

### Result

A single `describe` block with 6 tests covering the canonical 6 axes. The block must follow the existing project's vitest + supertest conventions (read 1-2 existing L2 files for the local idiom; do NOT invent a new pattern).

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling; no speculative paths or persona IDs.
- Bounded output: a single `describe` block; no extra scaffolding; no auxiliary helpers.

## Prerequisites

- `<TEST_FILE_PATH>` is in a workspace whose `package.json` has a `test` script and a working vitest setup.
- The route is genuinely workspace-scoped (the route handler reads `request.activeWorkspaceId` or equivalent and filters on it). If not, this skill does not apply — see Stop conditions.
- The project's seed data includes `<SECOND_PERSONA_ID>` (verify by reading the seed file referenced in `docs/TESTING.md` or asking the maintainer).

## Commands

1. (Read) Open one existing L2 test file in the same project (e.g. `services/api/src/tests/brewSessions.test.ts`) to confirm the local vitest + supertest idiom.
2. (Read) Open `packages/contracts/src/<area>/<file>.ts` to confirm `<CONTRACT_TYPE_NAME>` shape.
3. (Write) Emit the new `describe` block — appended to `<TEST_FILE_PATH>` if it exists, or as a new file.
4. (Verify) Run the test to confirm it goes green: `cd <REPO_ROOT> && npm --workspace=<WORKSPACE_NAME> run test -- --run <TEST_FILE_BASENAME>`.

(Reserve any unused command slot for genuine follow-ups only; do not pad.)

## Stop conditions

- The route is NOT workspace-scoped (e.g. it's a platform-admin route or a public-data route). The 6-axis pattern does not apply; suggest a different test pattern instead.
- `<SECOND_PERSONA_ID>` does not exist in seed data. Ask the maintainer to add it OR pick an existing alternate persona.
- `<TEST_FILE_PATH>` exists AND already has a `describe` block matching the proposed name. Stop and ask the maintainer whether to merge or replace.
- More than 5 commands would be needed (the test pattern is more complex than 6-axis canonical; escalate).
