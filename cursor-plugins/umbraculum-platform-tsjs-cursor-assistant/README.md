# umbraculum-platform-tsjs-cursor-assistant

Umbraculum-platform-specific Cursor assistant for the **TS/JS half** of projects that adopt the umbraculum-toolset four-slice foundation-hardening discipline and multi-tenant workspace-scoped architectural patterns.

This plugin **assumes** `umbraculum-node-react-cursor-assistant` is also installed (and `umbraculum-toolset-common` for the language-agnostic meta-framework rules). It is the project-specific layer on top: cross-slice anchor rules, subagents that wrap umbraculum-specific tooling, and skills that scaffold the umbraculum architectural patterns. None of its artifacts make sense outside umbraculum-platform projects.

## When to install

- **Install in**: umbraculum-dev (the canonical platform repo) and any future project that adopts the same conventions (four-slice foundation hardening + multi-tenant workspace-scoped routes).
- **Do not install in**: generic TS/JS projects, the Magento codebase, or any project without `docs/FOUNDATION-HARDENING.md` and the umbraculum monorepo layout (`apps/*`, `services/*`, `packages/*` with workspace-scoped routing).

## Contents

### Rules (`rules/`)

- `02-foundation-hardening.mdc` — cross-slice anchor. Always-on. Routes contributors to the synthesis doc + per-slice docs before broad TS/JS work.
- `45-tsjs-module-readme-standard.mdc` — module-README authoring standard. Encodes the canonical template, the audit checklist, and the package-scope discipline (use the scope matching the current `package.json` `name` field; do not anticipate the future `@umbraculum/*` rename).
- `46-web-route-shape.mdc` — web route-group physical-layout standard. Encodes the two β disciplines (no group-root `page.tsx`, no group-root dynamic segment), the URL-segment ownership contract via `@umbraculum/module-sdk`'s `registerWebModule()`, and the CI gate (`scripts/check-web-url-segments.ts`). Authored as the Week-1 web-route audit's plugin deliverable (umbraculum-dev RFC-0006 + `docs/design/web-route-group-audit.md`).
- `47-prisma-multischema-module-schemas.mdc` — Prisma `multiSchema` discipline for module-owned Postgres schemas (`platform`, `brewery`, `automation`, etc.). Encodes the `@@schema("…")` + `prismaSchema` registration contract, cross-schema `@relation` rules, and the reporting-view reset caveat for `test:db:prepare`. Authored as the RFC-0010 plugin deliverable (umbraculum-dev `docs/rfcs/0010-platform-brewery-postgres-schema-split.md`).

### Agents (`agents/`)

- `types-baseline-verifier.md` — readonly subagent. Confirms `tsc --noEmit` is green for the affected workspace and that the 6 strict flags are set. Wraps the canonical skill `typescript-strict-flag-verification`.
- `module-readme-checker.md` — readonly subagent. Wraps `scripts/docs/check-readmes.py` for a bounded OK/FAIL summary on affected module READMEs.

### Skills (`skills/`)

- `typescript-strict-flag-verification/SKILL.md` — bounded runbook for the types verifier subagent.
- `module-readme-verification/SKILL.md` — bounded runbook for the README checker subagent.
- `l2-cross-workspace-isolation-test/SKILL.md` — scaffolds the canonical 6-axis L2 (route-integration) test pattern for workspace-scoped routes. No paired subagent (this is a write-side skill).
- `package-scope-migration-preflight/SKILL.md` — per-slot file inventory + classification gate + hard-stop flags for the umbraculum-dev sub-plan #9 `@brewery/*` → `@umbraculum/*` package-scope rename. Codified after slots 1 + 2 of the migration (the "codify on second use" cadence); designed for reuse across slots 3–14. Read-only.

## Witness rule

The witness rule registered for this plugin in the umbraculum-toolset's witness-rule registry is **`02-foundation-hardening.mdc`** (the first rule listed under "Rules" above). Its frontmatter is `alwaysApply: true` (no `globs:`), so it is an **unconditional** witness — Cursor loads it into the agent's context in every conversation regardless of which files are open, and rule-list introspection in a downstream `AGENTS.md` apparatus self-check is sufficient verification.

See the toolset-level [`cursor-plugins/README.md` § "Witness-rule contract for downstream `AGENTS.md` consumers"](../README.md#witness-rule-contract-for-downstream-agentsmd-consumers) for the full contract and the unconditional-vs-conditional activation-category framework.

## Foundation-hardening provenance

These artifacts are the §8 plugin-pack handoff manifest from umbraculum-dev's `docs/FOUNDATION-HARDENING.md` v1.0 (closed 2026-05-18 at commit `8eca6c4`, before the brewery-app → umbraculum-dev project rename). The foundation-hardening plan that motivated this split is archived alongside this plugin at [`cursor-plugins/docs/archive/foundation-hardening-plugin-pack.plan.md`](../docs/archive/foundation-hardening-plugin-pack.plan.md).

## Version history

- **0.0.1** (2026-05-25) — public baseline after the repository history reset. Includes the current umbraculum-platform TS/JS rules, skills, and verifier agents, including the web-route-shape and module-README disciplines.

## See also

- `/path/to/umbraculum-toolset/cursor-plugins/README.md` — multi-plugin overview + install + the why-pair-both rationale.
- `/path/to/umbraculum-toolset/cursor-plugins/umbraculum-node-react-cursor-assistant/` — the generic companion plugin.
- `/path/to/umbraculum-toolset/cursor-plugins/umbraculum-toolset-common/` — the language-agnostic meta-framework rules + the `generate-development-local` skill.
