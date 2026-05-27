---
name: plan-documentation-context
description: Scaffold the required Documentation context table for a Cursor/Composer feature plan in umbraculum-class repos. Use when authoring multi-phase plans for RFC-backed work (rendering, modules, waves) before handing off to an executor.
---

# Skill: Plan documentation context scaffold

Emits the `## Documentation context (required)` section for pasting into a plan file.

## Inputs required (do not assume)

- `<TASK_KEYWORDS>` — e.g. "MRP Wave 6 rendering", "PIM channel feed", "RFC-0008 notifications".
- `<REPO_ROOT>` — path to repo with `docs/design/plan-documentation-context-template.md`.

## Output format (return exactly)

### Prerequisites

### Documentation context section

### Stop conditions

## Bounds (hard)

- Max **2** read commands (template file + one surface doc if needed).
- Output ≤40 lines.
- No speculative RFC numbers — only map keywords to known docs in umbraculum-dev.

## Prerequisites

- Template exists at `<REPO_ROOT>/docs/design/plan-documentation-context-template.md`.

## Commands

1. Read the template file.
2. From `<TASK_KEYWORDS>`, fill the table: if "rendering" or "template", link RFC-0007 + `canonical-document-rendering-surface.md`; if "notification" or "email delivery", link RFC-0008 + notifications surface; if module code (mrp/crp/pim), link that module surface doc.

## Stop conditions

- Return a copy-paste-ready `## Documentation context (required)` table only.
- If keywords ambiguous, list two RFC options and ask user to pick one (do not invent paths).
