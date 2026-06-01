---
name: plan-documentation-context
description: Scaffold the required Standards & governance context, Documentation context, and Local verification before push sections for a Cursor/Composer feature plan in umbraculum-class repos. At plan completion, emit YAML verification todos for pertinent pre-push workflows. Use when authoring multi-phase plans for RFC-backed work before handing off to an executor.
---

# Skill: Plan standards + documentation context scaffold

Emits **three** required plan header sections for pasting into a `.plan.md` file:

1. `## Standards & governance context (required)` — first content section after frontmatter
2. `## Documentation context (required)` — immediately after
3. `## Local verification before push (required)` — immediately after section 2

At **plan completion**, also emit a YAML `todos:` block with one checkable item per non-struck row in section 3.

Enforced by `umbraculum-toolset-common/rules/49-plan-documentation-context.mdc`.

## Inputs required (do not assume)

- `<TASK_KEYWORDS>` — e.g. "MRP Wave 6 rendering", "OpenAPI Phase C", "PIM channel feed".
- `<REPO_ROOT>` — path to repo with `docs/design/plan-documentation-context-template.md` (umbraculum-dev) or equivalent.
- `<CHANGE_SURFACE>` — which areas the plan touches: `docs-only` | `ts-lint` | `ts-types` | `api` | `packages` | `openapi` | `mixed` (comma-separated ok).

## Output format (return exactly)

### Prerequisites

### Standards & governance context section

### Documentation context section

### Local verification before push section

### Plan completion todos (YAML)

### Stop conditions

## Bounds (hard)

- Max **4** read commands (template + optional `docs/VERIFICATION-TIERS.md` skim + `docs/CODING-STANDARDS.md` skim + one surface doc if needed).
- Output ≤70 lines.
- No speculative RFC numbers — only map keywords to known docs in umbraculum-dev.

## Prerequisites

- Template exists at `<REPO_ROOT>/docs/design/plan-documentation-context-template.md` OR operator confirms sibling-repo layout.

## Commands

1. Read the template file when present; read `<REPO_ROOT>/docs/VERIFICATION-TIERS.md` when `<CHANGE_SURFACE>` is not `docs-only`.
2. From `<TASK_KEYWORDS>`, fill **section 1**:
   - Governing RFC with § numbers.
   - `docs/CODING-STANDARDS.md` when repo is umbraculum-dev (or equivalent path); check only rows that apply.
   - Foundation gates (`LINTING.md`, `TESTING.md`, `TYPING.md`) when plan touches TS/JS.
   - Plugin rules by filename (rendering → `48-rfc-companion-documentation-gate.mdc`; API routes → `22-typescript-contracts-runtime-validation.mdc`, `45-public-endpoint-verification.mdc`; verification → `76-verification-tiers-gate`, `72-ci-parity-local-vs-ci-divergence`, `75-api-integration-pre-push-gate`; plans → `49-plan-documentation-context.mdc`).
3. Fill **section 2** from keywords: rendering → RFC-0007 + `canonical-document-rendering-surface.md`; notifications → RFC-0008 + notifications surface; module code (mrp/crp/pim) → that module surface doc.
4. Fill **section 3** from `<CHANGE_SURFACE>` using rule 49 matrix — **strike** rows that do not apply; never list "run all workflows".
5. Emit **Plan completion todos (YAML)** — one `todos:` entry per non-struck section 3 row, ids prefixed `verify-t1-` / `verify-t2-`.

## Section 3 quick map (pertinent only)

| `<CHANGE_SURFACE>` | Include rows |
|--------------------|--------------|
| `docs-only` | docs-readmes ci-parity only |
| `ts-lint` | T1 verify slice + ci-parity `lint` |
| `ts-types` | T1 slice + build-package as needed + ci-parity `typecheck` |
| `api` | T1 slice + ci-parity pertinent jobs + **api-integration-tests-pre-push** |
| `openapi` | `npm run verify:openapi` T1 + ci-parity jobs touching api/contracts |
| `packages` | `check-packages-dist-up-to-date.sh` + sdk-publish-prep when SDK batch |
| `mixed` | `verify:from-diff` T1 + `verify:pre-push` T2 |

Note: first local `npx @umbraculum/ci-parity` run may exceed GHA until Docker named volumes warm — prefer T1 during iteration.

## Stop conditions

- Return copy-paste-ready **all three** sections in order, then YAML todos.
- If keywords ambiguous, list two RFC options and ask operator to pick one (do not invent paths).
- If `docs/CODING-STANDARDS.md` is absent, strike the coding-standards row and note `(n/a)`.
- If `<CHANGE_SURFACE>` omitted, ask operator before emitting section 3.

## Fits the system

Input-driven (3 named placeholders), output-constrained (Prerequisites / three sections / YAML todos / Stop conditions), bounded (max 4 reads, ≤70 lines). Suitable for a future local-model plan-preflight subagent that regex-checks headings + at least one `verify-t2-` todo.
