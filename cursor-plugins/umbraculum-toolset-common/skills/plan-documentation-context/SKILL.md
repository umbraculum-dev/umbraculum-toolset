---
name: plan-documentation-context
description: Scaffold the required Standards & governance context block and Documentation context table for a Cursor/Composer feature plan in umbraculum-class repos. Use when authoring multi-phase plans for RFC-backed work (rendering, modules, waves) before handing off to an executor.
---

# Skill: Plan standards + documentation context scaffold

Emits **both** required plan header sections for pasting into a `.plan.md` file:

1. `## Standards & governance context (required)` — first content section after frontmatter
2. `## Documentation context (required)` — immediately after

Enforced by `umbraculum-toolset-common/rules/49-plan-documentation-context.mdc`.

## Inputs required (do not assume)

- `<TASK_KEYWORDS>` — e.g. "MRP Wave 6 rendering", "PIM channel feed", "RFC-0008 notifications".
- `<REPO_ROOT>` — path to repo with `docs/design/plan-documentation-context-template.md` (umbraculum-dev) or equivalent.

## Output format (return exactly)

### Prerequisites

### Standards & governance context section

### Documentation context section

### Stop conditions

## Bounds (hard)

- Max **3** read commands (template file + optional `docs/CODING-STANDARDS.md` skim + one surface doc if needed).
- Output ≤55 lines.
- No speculative RFC numbers — only map keywords to known docs in umbraculum-dev.

## Prerequisites

- Template exists at `<REPO_ROOT>/docs/design/plan-documentation-context-template.md` OR operator confirms sibling-repo layout.

## Commands

1. Read the template file when present.
2. From `<TASK_KEYWORDS>`, fill **section 1**:
   - Governing RFC with § numbers.
   - `docs/CODING-STANDARDS.md` when repo is umbraculum-dev (or equivalent path); check only rows that apply.
   - Foundation gates (`LINTING.md`, `TESTING.md`, `TYPING.md`) when plan touches TS/JS.
   - Plugin rules by filename (rendering → `48-rfc-companion-documentation-gate.mdc`; API routes → `22-typescript-contracts-runtime-validation.mdc`, `45-public-endpoint-verification.mdc`; plans → `49-plan-documentation-context.mdc`).
3. Fill **section 2** from keywords: rendering → RFC-0007 + `canonical-document-rendering-surface.md`; notifications → RFC-0008 + notifications surface; module code (mrp/crp/pim) → that module surface doc.

## Stop conditions

- Return copy-paste-ready **both** sections in order (standards first).
- If keywords ambiguous, list two RFC options and ask operator to pick one (do not invent paths).
- If `docs/CODING-STANDARDS.md` is absent, strike the coding-standards row and note `(n/a)`.

## Fits the system

Input-driven (2 named placeholders), output-constrained (Prerequisites / two sections / Stop conditions), bounded (max 3 reads, ≤55 lines). Suitable for a future local-model plan-preflight subagent.
