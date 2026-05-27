# umbraculum-node-react-cursor-assistant

Generic Node/TypeScript/React/E2E guardrail plugin for Cursor. Suitable for any TS/JS project — the `umbraculum-` brand prefix is for marketplace name-uniqueness, **not** because the plugin is umbraculum-specific.

This plugin is one of the four umbraculum-toolset Cursor plugins. The companion `umbraculum-platform-tsjs-cursor-assistant` plugin sits on top of it with umbraculum-platform-specific artifacts (multi-tenant workspace-scoped patterns, the four-slice foundation-hardening discipline); this plugin contains only ecosystem-generic guidance and is safe to install on its own (alongside `umbraculum-toolset-common`) in non-umbraculum TS/JS projects.

## Contents

- `rules/*.mdc`: Node/TypeScript/React/E2E and shared workflow guardrails.
- `skills/*/SKILL.md`: bounded runbook skills for Node, Playwright/E2E, browser checks, containers, and test-MCP patterns.
- `agents/*.md`: focused Cursor agents for E2E smoke and general verification.
- `docs/templates/DEVELOPMENT-LOCAL.md`: optional repo-local addendum template.

## Notable rules

- `00-shared-monorepo-package-boundary.mdc`
- `00-shared-node-npm-container-only.mdc`
- `22-typescript-contracts-runtime-validation.mdc`
- `23-eslint-flat-config-hygiene.mdc`
- `23a-eslint-fixall-discipline.mdc`
- `24-react-accessibility-first.mdc`
- `26-typescript-strict-flags.mdc`
- `30-e2e-no-hardcoded-paths.mdc`
- `67-playwright-quick-gates-before-run.mdc`
- `40-workflow-and-navigation.mdc`
- `44-tsjs-project-docs-first.mdc`
- `51-restart-dev-server-after-git-tree-mutations.mdc`
- `73-website-static-build-before-preview.mdc`
- `70-frontend-known-issues.mdc`
- `prisma-client-sync.mdc`

### Witness rule

The witness rule registered for this plugin in the umbraculum-toolset's witness-rule registry is **`22-typescript-contracts-runtime-validation.mdc`** (listed under "Notable rules" above). Its frontmatter is `alwaysApply: false` + `globs:` scoped to TS/JS file patterns (`apps/**/*.{ts,tsx,js,jsx}`, `services/**/*.{ts,tsx,js,jsx}`, `packages/**/*.{ts,tsx,js,jsx}`), so it is a **conditional** witness — Cursor only auto-attaches it when a matching TS/JS file is in the conversation's active context. It is silently absent from the agent's loaded rule list in conversations with no matching file open, even when this plugin is correctly installed on disk.

Downstream `AGENTS.md` authors performing an apparatus self-check for this plugin MUST therefore verify presence via the Read-based alternate mechanism — not by rule-list introspection. See the toolset-level [`cursor-plugins/README.md` § "Witness-rule contract for downstream `AGENTS.md` consumers"](../README.md#witness-rule-contract-for-downstream-agentsmd-consumers) for the full contract, the two-category model, and the anti-pattern warning against "fixing" the witness check by flipping `alwaysApply` to `true` on a rule whose content is genuinely file-scoped.

### Companion plugin: `umbraculum-toolset-common`

This plugin does not ship its own copies of the language-agnostic meta-framework artifacts. The following live in [`umbraculum-toolset-common`](../umbraculum-toolset-common/README.md), which must be installed alongside this plugin:

- `00-development-local-addendum-gate.mdc`
- `12-skill-contract.mdc`
- `41-commit-message-ticket-prefix.mdc`
- `skills/generate-development-local/`

The `cursor-plugins/scripts/install-local.sh` installer installs all four umbraculum-toolset plugins together. See the toolset-level [cursor-plugins/README.md](../README.md) for the pairing matrix and rationale.

## Notable skills

- `runtime-commands-containers`
- `node-npm-container-only`
- `build-workspace-packages-dist-in-container`
- `npm-workspaces-package-lock-invalid-version`
- `playwright-runner-docs-gate`
- `agentic-e2e-runbook`
- `agentic-browser-web-app`
- `test-mcp-server`

## Agents

- `e2e-smoke`
- `verifier`

## Version history

- **0.0.3** (2026-05-27) — Static brochure guardrail: rule `73-website-static-build-before-preview.mdc` (glob-scoped to `apps/website/public/**`); rebuild `dist/` before preview/verification after `public/` edits.
- **0.0.2** (2026-05-27) — Playwright quick gates: rule `67-playwright-quick-gates-before-run.mdc` (glob-scoped to `apps/web/e2e/**` and `e2e/playwright/**`); `playwright-runner-docs-gate` skill expanded with mandatory stack-health gate block, Umbraculum one-shot Docker template, and MRP/CRP export troubleshooting pointers (repo docs remain canonical SoT).
- **0.0.1** (2026-05-25) — public baseline after the repository history reset. Includes the current Node/TypeScript/React/E2E rules, skills, and verifier agents, plus the companion-plugin split with `umbraculum-toolset-common`.
