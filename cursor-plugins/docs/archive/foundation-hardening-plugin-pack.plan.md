# Foundation hardening — plugin-pack rollout plan

> 📦 **ARCHIVED PLAN.** Historical authoring record from 2026-05-18. The plan executed: Tasks 1.2 + 3.1 + 3.2 landed in `umbraculum-node-react-cursor-assistant` (referenced in the body below by its pre-rename name `node-react-cursor-assistant`); Tasks 1.1 + 1.3 + 2.1 + 2.2 + 2.3 landed in `umbraculum-platform-tsjs-cursor-assistant` (referenced below by its pre-rename name `umbraculum-cursor-assistant`); Task 3.3 was a no-op (Magento `90-testing.mdc` was already PHP-globbed).
>
> **Post-execution renames:** before the public baseline, the two TS/JS plugin folders were renamed for marketplace name-uniqueness and naming consistency:
> - `node-react-cursor-assistant/` → `umbraculum-node-react-cursor-assistant/`
> - `umbraculum-cursor-assistant/` → `umbraculum-platform-tsjs-cursor-assistant/`
>
> **Do not edit narrative.** The body below uses the pre-rename folder names — that is correct for an archived historical record. Absolute paths to the legacy plugin source have been neutralized to `<legacy-plugin-source>/...` placeholders so the repo carries no references to former workspace locations; the body otherwise reflects the plan's authoring context and may not match current on-disk locations. Consult the live plugin directories for current state.

| Field | Value |
|---|---|
| **Plan ID** | `foundation-hardening-plugin-pack-v1` |
| **Target plugin** | `rf-node-react-cursor-assistant` (TS/JS plugin) |
| **Target plugin root (canonical absolute)** | `<legacy-plugin-source>/rf-node-react-cursor-assistant/` |
| **Source-of-truth doc** | `/home/rf/dkprojects/rfapps/umbraculum-dev/docs/FOUNDATION-HARDENING.md` v1.0 (commit `8eca6c4`, 2026-05-18) |
| **Status** | Draft — not yet executed |
| **Owner** | maintainers (plugin-pack author) |
| **Estimated effort** | 1 focused session (~2-3h); all artifacts are bounded and follow existing meta-framework contracts. |
| **Prerequisite reading** | (1) Source-of-truth doc above (especially §8). (2) `rf-node-react-cursor-assistant/rules/12-skill-contract.mdc`, `13-rule-skill-authoring-gate.mdc`, `14-subagent-contract.mdc`, `15-subagent-delegation-guardrails.mdc`. |

---

## 0. Context

The umbraculum-dev project (`/home/rf/dkprojects/rfapps/umbraculum-dev/`) closed its four-slice foundation-hardening pass on 2026-05-18 (lint ✅, types ✅, tests ✅, docs ✅). The synthesis-layer doc `docs/FOUNDATION-HARDENING.md` published at the same time §8 contains the **plugin-pack handoff manifest**: 11 specific artifact proposals (3 new rules, 2 new subagents, 3 new skills, 3 minor refinements) that would make the foundation-hardening discipline *self-enforcing for future code* via the plugin pack instead of relying on after-the-fact CI gates alone.

This plan turns the §8 manifest into actionable tasks scoped to the `rf-node-react-cursor-assistant` plugin source.

**Plan-drafting side-finding**: §8.4's "tighten `90-testing.mdc` `globs:` to PHPUnit paths only" task is a no-op — verified during plan drafting. `90-testing.mdc` lives in `rf-magento-cursor-assistant/rules/` (NOT in the TS/JS plugin), and its globs are already PHP-only (`app/code/*/*/Test/**/*.php` etc.). It does not apply to TS/JS work and never did. Task removed from this plan; the `FOUNDATION-HARDENING.md` §8.4 entry can be retired in the next update of that doc (low-priority housekeeping; not in scope of this plan).

---

## 1. Prerequisites (read before starting)

Before executing any task in this plan:

1. Read the source-of-truth doc end-to-end: `/home/rf/dkprojects/rfapps/umbraculum-dev/docs/FOUNDATION-HARDENING.md`. Especially §8 (the manifest), §3 (the "by design" enforcement framing), and §5 (the cross-slice findings — those are the rationale for several of the proposed artifacts).
2. Read the meta-framework rules in the target plugin:
   - `rf-node-react-cursor-assistant/rules/12-skill-contract.mdc` (skill contract).
   - `rf-node-react-cursor-assistant/rules/13-rule-skill-authoring-gate.mdc` (when to use rule vs skill vs subagent).
   - `rf-node-react-cursor-assistant/rules/14-subagent-contract.mdc` (subagent contract).
   - `rf-node-react-cursor-assistant/rules/15-subagent-delegation-guardrails.mdc` (delegation triggers).
3. Confirm the plugin source layout:
   - Rules: flat `.mdc` files in `rf-node-react-cursor-assistant/rules/`.
   - Agents: flat `.md` files in `rf-node-react-cursor-assistant/agents/`.
   - Skills: each skill is a **directory** containing `SKILL.md` (e.g. `rf-node-react-cursor-assistant/skills/blocked-edit-tee-fallback/SKILL.md`).
4. Confirm there is no number collision in the new rules. Currently the plugin source has the following number prefixes in `rules/`: `00 (×6), 03, 05, 11, 12, 13, 14, 15, 20 (×2), 21, 22, 23, 23a, 24, 30, 40, 41, 42, 44`. The proposals use `02`, `26`, `45` — all free.

---

## 2. Phase 1 — Three new rules

### Task 1.1 — Cross-slice anchor

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/rules/02-foundation-hardening.mdc`
**Action**: Create new file.
**Type**: Rule (guardrail + pointer; `alwaysApply: true`).

**Full content**:

````mdc
---
description: Foundation-hardening pass — single entry point. Read the synthesis doc + slice docs before broad TS/JS work.
alwaysApply: true
---

# Foundation hardening (single entry point)

This project closed a four-slice foundation-hardening pass (lint, types, tests, docs) plus an orthogonal validation axis. The synthesis layer is the canonical entry point; the per-slice docs are the sources of truth.

## Read first when relevant

Project-local synthesis + per-slice docs (paths relative to repo root):

- `docs/FOUNDATION-HARDENING.md` — synthesis layer, the four slices at a glance, the cross-slice findings, the plugin-pack handoff manifest.
- `docs/LINTING.md` — ESLint slice (HIGH-light → HIGH-staged → HIGH-full; the `npm run lint` strict gate).
- `docs/TYPING.md` — TypeScript slice (`tsc --noEmit` baseline + the 6 candidate strict flags + the per-workspace CI gate).
- `docs/TESTING.md` — testing slice (L1 unit through L5 Playwright layers + the layered test-mapping discipline).
- `docs/DOCS-README-STANDARDS.md` — docs slice (module-README template + audit checklist + the structural CI gate).
- `docs/CONTRACTS-VALIDATION-STRATEGY.md` — orthogonal validation axis (decision: hand-rolled; trigger criteria for revisiting; audit log).

If a referenced doc is absent in this project, proceed with the generic guidance in this rule's body and ask only for values that are necessary for the task.

## Why this exists

The foundation hardening pass invested in *bug-prevention foundations* (lint + types + tests) plus *contributor-experience foundation* (docs) over a multi-week period. CI gates enforce the floor, but every gate fails *after* the violation reaches the codebase. The plugin pack (this rule + its siblings under `02-`, `22`, `23`, `23a`, `26`, `44`, `45`, etc.) prevents violations at authoring time, before the gate fires. Both layers compound; neither substitutes for the other.

## See also

- `.cursor/rules/22-typescript-contracts-runtime-validation.mdc` — boundary payload validation discipline (validation axis).
- `.cursor/rules/23-eslint-flat-config-hygiene.mdc` and `23a-eslint-fixall-discipline.mdc` — lint slice.
- `.cursor/rules/26-typescript-strict-flags.mdc` — types slice (the 6 strict flags as the floor for new TS workspaces).
- `.cursor/rules/44-tsjs-project-docs-first.mdc` — docs-first reading discipline.
- `.cursor/rules/45-tsjs-module-readme-standard.mdc` — module-README authoring standard.
````

**Verification**: file exists; YAML frontmatter parses; size ≤30 lines (excluding frontmatter); all referenced rule names exist in `rules/` after Phase 2 lands (this rule may be authored before its siblings; that's OK because Cursor doesn't validate cross-references between rules).

---

### Task 1.2 — TypeScript strict-flags rule

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/rules/26-typescript-strict-flags.mdc`
**Action**: Create new file.
**Type**: Rule (guardrail + pointer; globbed to TS files + tsconfigs).

**Full content**:

````mdc
---
description: TypeScript strict flags floor — the 6 candidate strict flags must be on for any new TS workspace; fix patterns must follow the canonical 4-pattern playbook.
alwaysApply: false
globs:
  - "**/tsconfig*.json"
  - "apps/**/*.{ts,tsx}"
  - "services/**/*.{ts,tsx}"
  - "packages/**/*.{ts,tsx}"
---

# TypeScript strict flags

When the project has closed a foundation-hardening types slice (see `docs/FOUNDATION-HARDENING.md` and `docs/TYPING.md`), the 6 candidate strict flags are the **floor** for any new TS workspace and any new TS code in an existing gated workspace.

## The 6 strict flags

A new `tsconfig.json` MUST inherit or set all six (in addition to `strict: true`):

- `noImplicitOverride` — requires the `override` keyword on subclass methods.
- `noPropertyAccessFromIndexSignature` — forces `obj['key']` for index-signature properties.
- `noUncheckedIndexedAccess` — `T[]` index access returns `T | undefined`.
- `exactOptionalPropertyTypes` — pins `foo?: T` vs `foo: T | undefined` distinction.
- `verbatimModuleSyntax` — forces explicit `import type` for type-only imports.
- `isolatedModules` — every file must be transpilable independently.

## Fix patterns when these flags surface errors

The four canonical fix patterns documented in `docs/TYPING.md` cover ~95% of cases:

1. **Type-widening** — add `| undefined` to optional fields at the type-declaration site (preferred when many call sites pass `undefined`).
2. **Conditional spread** — `...(value !== undefined ? { field: value } : {})` at call sites (use when the target type is owned by a 3rd-party generator like Prisma).
3. **Non-null assertion** — `arr[N]!` after a length guard, or destructure to a local `const m = found[0]!` (use when surrounding logic proves definedness).
4. **Optional-chain with fallback** — `obj?.field ?? null` when the field is genuinely optional in the consumer.

Do NOT use `as any`, `as unknown as T`, or `// @ts-expect-error` without a comment explaining the *specific reason* the suppression is correct. The lint slice's `no-explicit-any: error` rule already blocks the first; `@ts-expect-error` should pin a specific upstream issue (Tamagui shorthand props, Prisma generated-type bug, etc.) per the project's accepted-cost convention.

## Anti-patterns

- Adding a new TS workspace whose `tsconfig.json` does not inherit the 6 flags from the project's base tsconfig.
- Suppressing a strict-flag error with `as any` instead of applying one of the 4 fix patterns.
- Adding `// @ts-expect-error` without a one-line reason comment.
- Disabling a strict flag in a leaf tsconfig "temporarily" without recording the decision in `docs/TYPING.md`.

## See also

- `docs/TYPING.md` — canonical baseline + methodology + the per-flag rollout phase log.
- `docs/FOUNDATION-HARDENING.md` §4.2 + §5.3 — synthesis-layer view of the types slice.
- `.cursor/agents/types-baseline-verifier.md` — verifier subagent that confirms `tsc --noEmit` is green and the 6 flags are set.
````

**Verification**: file exists; YAML frontmatter parses; the proposed fix patterns match the §"How to fix" section of the project's `docs/TYPING.md` (the umbraculum-dev version is at commit `8eca6c4` if needed for reference).

---

### Task 1.3 — Module README standard rule

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/rules/45-tsjs-module-readme-standard.mdc`
**Action**: Create new file.
**Type**: Rule (guardrail + pointer; globbed to module READMEs).

**Full content**:

````mdc
---
description: TS/JS module README standard — when creating or editing a module README, follow the canonical template + audit checklist.
alwaysApply: false
globs:
  - "apps/*/README.md"
  - "services/*/README.md"
  - "packages/*/README.md"
---

# Module README standard

When the project has a `docs/DOCS-README-STANDARDS.md` doc (typical signal: a `scripts/docs/check-readmes.py` structural checker + a `.github/workflows/docs-readmes.yml` CI gate), follow the canonical template + audit checklist for any module README under `apps/*/README.md`, `services/*/README.md`, or `packages/*/README.md`.

## Authoring rules

- **Title** must match the package name in `package.json` (e.g. `# @brewery/foo` if the package is `"name": "@brewery/foo"`). For non-npm-workspace targets, use the canonical name in `docs/DOCS-README-STANDARDS.md` brand-token cheat-sheet.
- **Tagline** — one sentence after the title summarizing what the module is.
- **Brand callout** — the standard quoted block (see `docs/DOCS-README-STANDARDS.md` §Template).
- **Required `##` headings** — at minimum: `What this is`, `Scope`, `Build / test / lint (local)`, `How it fits in`, `Status`, `Further reading` (sub-component READMEs follow a lighter scope; see the standard for which sections become optional).
- **Cross-references** — the README must link out to at least 2-3 sibling docs from `docs/` or `packages/` (typed surface, contracts, design docs as relevant). The `Further reading` section is the canonical place.
- **No placeholders** — `<PLATFORM_NAME>`, `<TBD>`, `<XXX>` etc. must not appear in the published README.
- **No premature package-scope rename** — if the project's brand has been resolved (e.g. `Umbraculum` is the prose name) but the npm package scope rename (e.g. `@brewery/*` → `@umbraculum/*`) is parked behind a separate sub-plan, code blocks in the README must NOT use the future `@umbraculum/*` import paths. Use the current `@brewery/*` form. The CI gate enforces this; the rule fires at authoring time.

## When creating a new module README

Scaffold from the template in `docs/DOCS-README-STANDARDS.md` §Template. Do NOT re-invent the structure.

## When editing an existing module README

Run the audit checklist in `docs/DOCS-README-STANDARDS.md` §Audit checklist mentally before saving. Optionally, after the edit, delegate to the `module-readme-checker` subagent for a structural pass (it wraps `scripts/docs/check-readmes.py`).

## Anti-patterns

- Adding a new module without a README.
- Copying an existing README's title and forgetting to update it.
- Adding a `## Build` heading that is a sub-heading of `## Build / test / lint (local)` — that's not the canonical hierarchy; the canonical heading is the combined `## Build / test / lint (local)`.
- Linking to absent docs in `Further reading` (the CI gate's link checker will catch this; do not push hoping the link will materialize).

## See also

- `docs/DOCS-README-STANDARDS.md` — canonical template + audit checklist.
- `docs/FOUNDATION-HARDENING.md` §4.4 — synthesis-layer view of the docs slice.
- `.cursor/agents/module-readme-checker.md` — structural-validator subagent.
````

**Verification**: file exists; YAML frontmatter parses; globs match the structural-checker's scope (use `scripts/docs/check-readmes.py` source as cross-reference if a project copy is available, or just the standard).

---

## 3. Phase 2 — Two new subagents + three new skills

### Task 2.1 — `types-baseline-verifier` subagent + paired skill

#### 2.1.a — Subagent

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/agents/types-baseline-verifier.md`
**Action**: Create new file.

**Full content**:

````md
---
name: types-baseline-verifier
description: TypeScript types-slice verifier. Use proactively after editing a tsconfig.json, after adding a new TS file in a non-gated workspace, or after a strict-flag-related refactor. Confirms `tsc --noEmit` is green for the affected workspace and that the 6 strict flags are set. Read-only.
model: inherit
readonly: true
---

# types-baseline-verifier

You are a skeptical validator for the TypeScript types slice. You do not edit code. You confirm:

1. The affected workspace's `tsc --noEmit` is green (using the canonical one-off-container method documented in the project's `docs/TYPING.md` §Methodology).
2. The affected workspace's `tsconfig.json` (or its inheritance chain) carries all 6 strict flags: `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`.

## Read first

- The project's `DEVELOPMENT.md` (and `DEVELOPMENT-LOCAL.md` if present) to resolve `<NODE_IMAGE>`, `<REPO_ROOT>`, `<MONOREPO_ROOT_NODE_MODULES_PATH>`.
- The project's `docs/TYPING.md` §Methodology (the canonical measurement command).

## Procedure

Follow the canonical skill: `.cursor/skills/typescript-strict-flag-verification.md`. Do not deviate.

## Output (return exactly)

```
TYPECHECK <workspace>: OK | FAIL (N errors)
FLAGS <workspace>: 6/6 set | M/6 set (missing: flag1, flag2)
```

One line per check. If FAIL: include up to 3 representative `<file>:<line> <error-code> <message>` lines, no more. No full stack-trace dumps, no full tsc output.

## Stop conditions

- Affected workspace cannot be detected from the input (ask).
- Project lacks the canonical `node:20-slim` + `/repo/node_modules` setup (ask whether to fall back to in-container `tsc` and disclose the methodology mismatch).
- More than 5 commands would be needed (likely a misuse of this verifier; escalate).
````

**Verification**: YAML frontmatter parses; body ≤30 lines (excluding frontmatter); references the paired skill at `.cursor/skills/typescript-strict-flag-verification.md`; description has the explicit "Use proactively" delegation trigger.

#### 2.1.b — Paired skill

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/skills/typescript-strict-flag-verification/SKILL.md`
**Action**: Create new directory + new file.

**Full content**:

````md
---
name: typescript-strict-flag-verification
description: Verify a TS workspace passes `tsc --noEmit` and carries all 6 strict flags. Use when editing tsconfig.json, adding TS files to a non-gated workspace, or after a strict-flag-related refactor.
---

# TypeScript strict-flag verification

Use this skill to confirm a workspace's TypeScript baseline is clean (the canonical one-off-container method) AND that the workspace's tsconfig carries all 6 candidate strict flags.

## Inputs required (do not assume)

- `<WORKSPACE_PATH>` (absolute path to the workspace, e.g. `/home/rf/dkprojects/rfapps/umbraculum-dev/services/api`)
- `<REPO_ROOT>` (absolute path to the monorepo root, e.g. `/home/rf/dkprojects/rfapps/umbraculum-dev`)
- `<NODE_IMAGE>` (the canonical Node image; default `node:20-slim` if `docs/TYPING.md` doesn't override)

## Output format (return exactly)

### Prerequisites

(brief — what the skill inferred from inputs, no commands run yet)

### Commands

(the bounded list of commands that were run, with their exit codes)

### Stop conditions

(any condition that aborted the run, or `(none triggered)` if all commands succeeded)

### Result

```
TYPECHECK <workspace>: OK | FAIL (N errors)
FLAGS <workspace>: 6/6 set | M/6 set (missing: flag1, flag2)
```

If `FAIL`: append up to 3 representative `<file>:<line> <error-code> <message>` lines (no more).

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling; no speculative paths.
- Bounded output: no full tsc output dump; no full tsconfig dump; no node_modules inspection.

## Prerequisites

- `<WORKSPACE_PATH>` exists and contains a `tsconfig.json` (or `package.json` with a `typecheck` script).
- `<REPO_ROOT>/node_modules/.bin/tsc` exists at the monorepo-root hoisted location, OR the project documents an alternative typecheck command in `docs/TYPING.md`.

## Commands

1. `docker run --rm -v "<REPO_ROOT>:/repo" -w /repo <NODE_IMAGE> bash -lc 'cd /repo/<workspace-relative-path> && /repo/node_modules/.bin/tsc -p tsconfig.json --noEmit 2>&1 | head -30'`
2. `cat <WORKSPACE_PATH>/tsconfig.json` (or read it via the file-reading tool).
3. (Optional, only if the tsconfig `extends` a parent) `cat <PARENT_TSCONFIG_PATH>` to resolve flag inheritance.
4. (Reserved for the report-formatting step; no shell command needed if the model post-processes inline.)
5. (Reserved.)

## Stop conditions

- The file is binary or `<WORKSPACE_PATH>` does not exist.
- The canonical `<NODE_IMAGE>` is not pullable AND the project has no documented fallback.
- The typecheck output exceeds the head-30 cap repeatedly (signal that the failure is structural and needs a maintainer; do not paginate).
- Tsconfig inheritance chain is deeper than 2 levels (likely a misconfigured workspace; escalate).
````

**Verification**: file exists at `skills/typescript-strict-flag-verification/SKILL.md`; YAML frontmatter parses; the 3 contract sections (`Inputs required`, `Output format`, `Bounds (hard)`) are all present; max-5-commands rule respected; the 3 procedural sections (`Prerequisites`, `Commands`, `Stop conditions`) match the contract's required headings.

---

### Task 2.2 — `module-readme-checker` subagent + paired skill

#### 2.2.a — Subagent

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/agents/module-readme-checker.md`
**Action**: Create new file.

**Full content**:

````md
---
name: module-readme-checker
description: Module README structural validator. Use proactively after editing any module README under `apps/*/README.md`, `services/*/README.md`, or `packages/*/README.md`. Wraps `scripts/docs/check-readmes.py` and reports OK / FAIL on the structural + link checks. Read-only.
model: inherit
readonly: true
---

# module-readme-checker

You are a skeptical validator for the docs slice. You do not edit READMEs. You confirm:

1. Each affected module README passes the structural checks (title matches `package.json`, tagline present, brand callout present, required `##` headings, cross-reference count, link resolution, no placeholder leaks, no premature `@umbraculum/*` import paths in code blocks).
2. All cross-reference links resolve to existing files.

## Read first

- The project's `DEVELOPMENT.md` (and `DEVELOPMENT-LOCAL.md` if present) to resolve `<REPO_ROOT>` and confirm the structural-checker script path.
- The project's `docs/DOCS-README-STANDARDS.md` (the canonical template + audit checklist) — only as reference; do not re-implement the checks.

## Procedure

Follow the canonical skill: `.cursor/skills/module-readme-verification.md`. Do not deviate.

## Output (return exactly)

```
README <relative-path>: OK | FAIL (N issues)
```

One line per affected README. If `FAIL`: append up to 3 representative `<check-name>: <one-line-finding>` lines, no more. No full markdown dumps, no full link enumerations.

## Stop conditions

- The affected README path cannot be detected from the input (ask).
- The project lacks `scripts/docs/check-readmes.py` (the structural checker). Ask whether to fall back to a manual checklist read of `docs/DOCS-README-STANDARDS.md` §Audit checklist.
- More than 5 commands would be needed (likely a misuse; escalate).
````

**Verification**: YAML frontmatter parses; body ≤30 lines (excluding frontmatter); references the paired skill at `.cursor/skills/module-readme-verification.md`; description has the explicit "Use proactively" delegation trigger.

#### 2.2.b — Paired skill

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/skills/module-readme-verification/SKILL.md`
**Action**: Create new directory + new file.

**Full content**:

````md
---
name: module-readme-verification
description: Run the project's module-README structural + link checker against affected READMEs and return a bounded OK/FAIL summary.
---

# Module README verification

Use this skill to confirm a module README under `apps/*/README.md`, `services/*/README.md`, or `packages/*/README.md` conforms to the project's `docs/DOCS-README-STANDARDS.md` (via the project's `scripts/docs/check-readmes.py` structural + link checker).

## Inputs required (do not assume)

- `<README_PATH>` (absolute path to the affected README, e.g. `/home/rf/dkprojects/rfapps/umbraculum-dev/packages/contracts/README.md`)
- `<REPO_ROOT>` (absolute path to the monorepo root)

## Output format (return exactly)

### Prerequisites

(what was inferred from inputs)

### Commands

(the bounded list of commands run, with exit codes)

### Stop conditions

(`(none triggered)` if all succeeded; otherwise the specific stop condition met)

### Result

```
README <relative-path>: OK | FAIL (N issues)
```

If `FAIL`: append up to 3 representative `<check-name>: <one-line-finding>` lines.

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling; no speculative paths.
- Bounded output: no full markdown dump; no full link enumeration; no full failure list (cap at 3 representative findings).

## Prerequisites

- `<README_PATH>` exists.
- `<REPO_ROOT>/scripts/docs/check-readmes.py` exists (the structural checker — published as part of the docs slice's CI gate).
- `python3` is available on PATH (the script is zero-dependency Python).

## Commands

1. `python3 <REPO_ROOT>/scripts/docs/check-readmes.py 2>&1 | grep -E "^(<relative-readme-path>|ERROR:|WARN:)" | head -20`
   - The script prints a per-README pass/fail summary; grep narrows to the affected README + structural-error lines; head caps the output.
2. (Optional, only if the script reports a link-resolution failure) `ls -la <REPO_ROOT>/<broken-link-target>` to confirm whether the linked file is genuinely missing or whether the link is malformed.
3. (Reserved for the report-formatting step.)
4. (Reserved.)
5. (Reserved.)

## Stop conditions

- `<README_PATH>` is not under `apps/*/README.md`, `services/*/README.md`, or `packages/*/README.md` (the script does not check it; the rule does not apply).
- `<REPO_ROOT>/scripts/docs/check-readmes.py` is missing (the project has not landed the docs-slice CI gate). Fall back to manual audit-checklist read.
- The script's output exceeds the head-20 cap (signal that the failure is structural and needs a maintainer; do not paginate).
````

**Verification**: file exists at `skills/module-readme-verification/SKILL.md`; YAML frontmatter parses; the 3 contract sections (`Inputs required`, `Output format`, `Bounds (hard)`) are present; max-5-commands rule respected; the 3 procedural sections (`Prerequisites`, `Commands`, `Stop conditions`) match the contract.

---

### Task 2.3 — `l2-cross-workspace-isolation-test` skill (skill only, no subagent)

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/skills/l2-cross-workspace-isolation-test/SKILL.md`
**Action**: Create new directory + new file.

**Full content**:

````md
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
5. (Reserved.)

## Stop conditions

- The route is NOT workspace-scoped (e.g. it's a platform-admin route or a public-data route). The 6-axis pattern does not apply; suggest a different test pattern instead.
- `<SECOND_PERSONA_ID>` does not exist in seed data. Ask the maintainer to add it OR pick an existing alternate persona.
- `<TEST_FILE_PATH>` exists AND already has a `describe` block matching the proposed name. Stop and ask the maintainer whether to merge or replace.
- More than 5 commands would be needed (the test pattern is more complex than 6-axis canonical; escalate).
````

**Verification**: file exists at `skills/l2-cross-workspace-isolation-test/SKILL.md`; YAML frontmatter parses; the 3 contract sections (`Inputs required`, `Output format`, `Bounds (hard)`) are present; max-5-commands rule respected.

---

## 4. Phase 3 — Two refinements (Task 3.3 from `FOUNDATION-HARDENING.md` §8 is a no-op; see §0)

### Task 3.1 — Refine `rules/44-tsjs-project-docs-first.mdc`

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/rules/44-tsjs-project-docs-first.mdc`
**Action**: Edit existing file.

The current "Read first when relevant" section lists 6 doc kinds. The refinement adds a new entry at the top for the synthesis-layer doc, so contributors are routed to the bird's-eye view first.

**StrReplace target** (current text):

```
## Read first when relevant

- Testing strategy: `docs/TESTING.md`, `TESTING.md`, or equivalent.
- Linting strategy: `docs/LINTING.md`, `eslint.config.*` comments, or equivalent.
```

**StrReplace replacement**:

```
## Read first when relevant

- Foundation-hardening synthesis: `docs/FOUNDATION-HARDENING.md` or equivalent. (When the project has run a foundation-hardening pass, this is the single entry point that ties together lint + types + tests + docs.)
- Testing strategy: `docs/TESTING.md`, `TESTING.md`, or equivalent.
- Linting strategy: `docs/LINTING.md`, `eslint.config.*` comments, or equivalent.
- Typing strategy (TypeScript strict-flag rollout, per-workspace `tsc --noEmit` baseline): `docs/TYPING.md`, or equivalent.
- Module-README standard: `docs/DOCS-README-STANDARDS.md`, or equivalent.
```

(Adds two new entries — `FOUNDATION-HARDENING.md` and `TYPING.md` — and the `DOCS-README-STANDARDS.md` entry. Keeps the existing 6 entries unchanged.)

**Verification**: the rule still parses; the 5-line edit lands inline; existing test/lint/contracts/accessibility/architecture entries below remain untouched.

---

### Task 3.2 — Refine `rules/22-typescript-contracts-runtime-validation.mdc`

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/rules/22-typescript-contracts-runtime-validation.mdc`
**Action**: Edit existing file.

The current "Schema-library decisions" section ends with the line *"If a schema-library migration is proposed, treat it as an architecture decision: include bundle impact, server/client consistency, migration scope, test updates, and whether mixed adoption would be worse than the current pattern."* — the refinement appends a one-line pointer to the structured 6-criteria check that the consuming project's `CONTRACTS-VALIDATION-STRATEGY.md` defines, so an AI tempted to migrate is routed to the structured check instead of free-form re-evaluation.

**StrReplace target** (current text — last paragraph of the rule body, just before `## Anti-patterns`):

```
If a schema-library migration is proposed, treat it as an architecture decision: include bundle impact, server/client consistency, migration scope, test updates, and whether mixed adoption would be worse than the current pattern.
```

**StrReplace replacement**:

```
If a schema-library migration is proposed, treat it as an architecture decision: include bundle impact, server/client consistency, migration scope, test updates, and whether mixed adoption would be worse than the current pattern. When the consuming project ships a `docs/CONTRACTS-VALIDATION-STRATEGY.md` (or equivalent), do NOT re-evaluate the decision free-form — walk that doc's "When to revisit" trigger criteria explicitly and append a per-criterion audit row to its audit log. The structured check is the only path to re-opening the decision.
```

**Verification**: the rule still parses; the appended sentence reads cleanly after the existing one; existing anti-patterns block below is unaffected.

---

### Task 3.3 — NO-OP (FOUNDATION-HARDENING.md §8.4 entry is already satisfied)

The §8.4 entry in `FOUNDATION-HARDENING.md` proposes "Tighten `90-testing.mdc` `globs:` to PHPUnit paths only so it does not apply to TS/JS work". Verification during plan drafting confirms:

- `90-testing.mdc` lives in `rf-magento-cursor-assistant/rules/`, NOT in `rf-node-react-cursor-assistant/rules/`. So it does not appear in this plan's target plugin at all.
- Its `globs:` in the Magento plugin source already restrict it to `app/code/*/*/Test/**/*.php`, `dev/tests/**/*.php`, `vendor/**/Test/**/*.php`, and `**/*Test.php`. No TS/JS file matches any of these globs.

Conclusion: the proposed refinement is a no-op against the current plugin source. Skip the task. Optional housekeeping (not in this plan): retire the §8.4 task entry from `FOUNDATION-HARDENING.md` v1.0 in a future minor revision (not blocking).

---

## 5. Verification (after all tasks land)

### 5.1 Plugin source-side verification

Inside `<legacy-plugin-source>/rf-node-react-cursor-assistant/`:

1. **Rules**: confirm 3 new files exist under `rules/`: `02-foundation-hardening.mdc`, `26-typescript-strict-flags.mdc`, `45-tsjs-module-readme-standard.mdc`. Each has valid YAML frontmatter (run a quick sanity check by `head -10` on each).
2. **Agents**: confirm 2 new files exist under `agents/`: `types-baseline-verifier.md`, `module-readme-checker.md`. Each has valid YAML frontmatter with `name`, `description`, `model`, and `readonly: true`.
3. **Skills**: confirm 3 new directories exist under `skills/`: `typescript-strict-flag-verification/`, `module-readme-verification/`, `l2-cross-workspace-isolation-test/`. Each contains a `SKILL.md`. Each `SKILL.md` has the 3 contract sections (`Inputs required`, `Output format`, `Bounds (hard)`) and the 3 procedural sections (`Prerequisites`, `Commands`, `Stop conditions`).
4. **Refinements**: confirm `44-tsjs-project-docs-first.mdc` and `22-typescript-contracts-runtime-validation.mdc` parse cleanly after the in-place edits.

### 5.2 Sanity-spot-check end-to-end

Pick one rule (e.g. `26-typescript-strict-flags.mdc`) and confirm Cursor's plugin loader accepts the YAML frontmatter without complaint by enabling the plugin in a Cursor session against the umbraculum-dev repo. The rule should appear in the rule-listing UI; the linked subagent (`types-baseline-verifier`) should be discoverable.

(This is a manual check — there is no automated end-to-end test for plugin loading.)

### 5.3 Umbraculum-dev side cross-check

The umbraculum-dev repo at `/home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/rules/` is the project that motivated this plan. After the plugin updates land + the consuming project pulls the new plugin version:

- `02-foundation-hardening.mdc` lands at `/home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/rules/02-foundation-hardening.mdc`.
- The 3 new artifacts are visible to Cursor when working in the umbraculum-dev repo.
- Umbraculum-dev's existing `26-config-guard-logging.mdc` (Magento heritage; remains unchanged) and the new `26-typescript-strict-flags.mdc` (TS/JS new) **coexist** because they have different globs (one targets PHP files, the other targets TS files + tsconfig). If the user finds the duplicate `26-` prefix confusing, renumber `26-typescript-strict-flags.mdc` to `25-typescript-strict-flags.mdc` (free in both plugins) and update the cross-references in `02-foundation-hardening.mdc` + `FOUNDATION-HARDENING.md` §8 accordingly. (Documented as a follow-up; not a blocker.)

---

## 6. Versioning + commit message

Bump the TS/JS plugin version per the workspace's versioning convention (`README.md` "Update and versioning"):

**Path**: `<legacy-plugin-source>/rf-node-react-cursor-assistant/.cursor-plugin/plugin.json`

Bump the `version` field according to the change kind. This plan is a **minor** version bump (3 new rules + 2 new subagents + 3 new skills + 2 refinements; backward-compatible additions; no removals or behavior changes for existing rules).

**Tag** the release per the workspace's tagging convention: `rf-node-react-cursor-assistant-vX.Y.Z` where `X.Y.Z` is the bumped version.

**Suggested commit message** (HEREDOC form to preserve formatting; the `rf-` prefix is the workspace convention):

```text
rf-node-react: foundation-hardening plugin-pack rollout (3 rules + 2 agents + 3 skills + 2 refinements)

Implements the §8 plugin-pack manifest from
/home/rf/dkprojects/rfapps/umbraculum-dev/docs/FOUNDATION-HARDENING.md v1.0
(umbraculum-dev commit 8eca6c4, 2026-05-18). Makes the four-slice
foundation-hardening discipline (lint + types + tests + docs) self-
enforcing at authoring time, complementing the per-slice CI gates.

NEW RULES:
- 02-foundation-hardening.mdc — cross-slice anchor; alwaysApply: true;
  routes contributors to the synthesis doc + 4 slice docs first.
- 26-typescript-strict-flags.mdc — encodes the 6 strict flags as the
  floor for new TS workspaces + the 4 canonical fix patterns from
  docs/TYPING.md.
- 45-tsjs-module-readme-standard.mdc — encodes the docs-slice template
  + audit checklist; globs to apps/services/packages READMEs.

NEW SUBAGENTS (both readonly):
- types-baseline-verifier — confirms tsc --noEmit green + 6 flags set;
  paired skill at skills/typescript-strict-flag-verification/.
- module-readme-checker — wraps scripts/docs/check-readmes.py for a
  bounded OK/FAIL summary; paired skill at skills/module-readme-
  verification/.

NEW SKILLS:
- typescript-strict-flag-verification (paired to types-baseline-verifier).
- module-readme-verification (paired to module-readme-checker).
- l2-cross-workspace-isolation-test (no subagent; scaffolds the
  canonical 6-axis L2 test pattern for workspace-scoped routes).

REFINEMENTS:
- 44-tsjs-project-docs-first.mdc — append FOUNDATION-HARDENING.md +
  TYPING.md + DOCS-README-STANDARDS.md to the "Read first" list.
- 22-typescript-contracts-runtime-validation.mdc — append cross-
  reference to CONTRACTS-VALIDATION-STRATEGY.md §"When to revisit"
  (the structured 6-criteria check).

NO-OP (verified during plan drafting):
- 90-testing.mdc — already PHP-globbed in rf-magento-cursor-assistant,
  does not apply to TS/JS work; FOUNDATION-HARDENING.md §8.4 task is
  retired (housekeeping, future minor doc revision).
```

---

## 7. Rollout to consuming projects

After the plugin version bumps + the new tag is pushed:

### 7.1 Umbraculum-dev (the motivating project)

Path: `/home/rf/dkprojects/rfapps/umbraculum-dev/`

This project's `.cursor/rules/`, `.cursor/skills/`, `.cursor/agents/` are sync'd from the plugin pack. Update steps:

1. Pull the new plugin version (per the workspace `README.md` "Git repo install" + "Update and versioning" sections).
2. Run the project's existing sync mechanism (the project doesn't appear to have a dedicated sync script for the plugin pack; verify by reading the project's `DEVELOPMENT.md` or the workspace `README.md` "Source sync policy" section). If no automated sync exists, copy the new artifacts manually:
   - `cp <legacy-plugin-source>/rf-node-react-cursor-assistant/rules/02-foundation-hardening.mdc /home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/rules/`
   - `cp <legacy-plugin-source>/rf-node-react-cursor-assistant/rules/26-typescript-strict-flags.mdc /home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/rules/`
   - `cp <legacy-plugin-source>/rf-node-react-cursor-assistant/rules/45-tsjs-module-readme-standard.mdc /home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/rules/`
   - `cp <legacy-plugin-source>/rf-node-react-cursor-assistant/agents/types-baseline-verifier.md /home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/agents/`
   - `cp <legacy-plugin-source>/rf-node-react-cursor-assistant/agents/module-readme-checker.md /home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/agents/`
   - For skills, the umbraculum-dev side currently has flat `.md` files (not directories); copy each `<skill>/SKILL.md` to `<skill>.md` in `.cursor/skills/`:
     - `cp <plugin>/skills/typescript-strict-flag-verification/SKILL.md /home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/skills/typescript-strict-flag-verification.md`
     - `cp <plugin>/skills/module-readme-verification/SKILL.md /home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/skills/module-readme-verification.md`
     - `cp <plugin>/skills/l2-cross-workspace-isolation-test/SKILL.md /home/rf/dkprojects/rfapps/umbraculum-dev/.cursor/skills/l2-cross-workspace-isolation-test.md`
   - Apply Phase 3 refinements similarly: re-copy the updated `44-tsjs-project-docs-first.mdc` and `22-typescript-contracts-runtime-validation.mdc` from the plugin source into the project's `.cursor/rules/`.
3. Commit the umbraculum-dev side's plugin sync (separate commit from this plan's plugin-pack commit). Suggested message format mirrors the existing convention: `chore(.cursor): sync plugin pack vX.Y.Z (foundation-hardening rollout)`.
4. Verify in Cursor: open the umbraculum-dev repo; the new rules + agents + skills appear in the appropriate UI listings. Trigger one of the new subagents (e.g. `types-baseline-verifier` after a tsconfig edit) to confirm delegation works.
5. (Optional) Add a one-liner to umbraculum-dev's `docs/FOUNDATION-HARDENING.md` §8 sign-off appending "v1.1: plugin-pack manifest implemented in rf-node-react-cursor-assistant vX.Y.Z (commit `<HASH>`); §8.7 entries are now ✅".

### 7.2 Other projects using the plugin

Same workflow. The new artifacts are additive and do not change behavior of existing rules, so the rollout risk is low. The two refinements (Task 3.1 + Task 3.2) extend existing rules with additional pointers; no existing guidance is removed or changed.

---

## 8. Stop conditions / when to ask the maintainer

This plan is structured to be executed mechanically. Stop and ask the maintainer if:

- A proposed numbered rule path is already taken in the plugin source (a different rule with the same NN-prefix exists). The plan assumes 02, 26, 45 are free; if they are not, renumber and update cross-references.
- The plugin version-bump strategy is unclear (the workspace `README.md` is the canonical doc; this plan defers to it).
- The umbraculum-dev project's plugin-sync mechanism turns out to be different from manual file copies (a sync script may have been added since this plan was drafted).
- Any cross-reference path in the new rules / subagents / skills resolves to a doc that the consuming project does not have. The rules are written defensively ("when the project has X" guards), so a missing doc should not break a rule — but please verify on first rollout.

---

## Appendix — file inventory

After this plan executes, the following 8 files exist or are modified in `<legacy-plugin-source>/rf-node-react-cursor-assistant/`:

| File | Action |
|---|---|
| `rules/02-foundation-hardening.mdc` | NEW |
| `rules/26-typescript-strict-flags.mdc` | NEW |
| `rules/45-tsjs-module-readme-standard.mdc` | NEW |
| `rules/44-tsjs-project-docs-first.mdc` | EDIT (~5 lines) |
| `rules/22-typescript-contracts-runtime-validation.mdc` | EDIT (~3 lines) |
| `agents/types-baseline-verifier.md` | NEW |
| `agents/module-readme-checker.md` | NEW |
| `skills/typescript-strict-flag-verification/SKILL.md` | NEW (+ new dir) |
| `skills/module-readme-verification/SKILL.md` | NEW (+ new dir) |
| `skills/l2-cross-workspace-isolation-test/SKILL.md` | NEW (+ new dir) |
| `.cursor-plugin/plugin.json` | EDIT (`version` bump) |

Plus the version tag (`rf-node-react-cursor-assistant-vX.Y.Z`) pushed to the plugin git remote.

Total: 11 file changes (8 new + 3 edits) + 1 tag.

---

## Sign-off

This plan was drafted by the umbraculum-dev foundation-hardening agent on 2026-05-18 immediately after committing umbraculum-dev commit `8eca6c4` (the synthesis-layer doc + validation re-audit). It is the discrete handoff to the plugin-pack maintenance workflow. When the plan executes, this file can be moved to `docs/archive/` (or equivalent) for historical reference.

Next agent / next session: read §0–§1, walk §2–§4 in order, then §5–§7 for verification + rollout. Each task is bounded and has explicit verification; the plan should not need clarification mid-execution unless one of the §8 stop conditions fires.

