# umbraculum-node-react-cursor-assistant

Generic Node/TypeScript/React/E2E guardrail plugin for Cursor. Suitable for any TS/JS project — the `umbraculum-` brand prefix is for marketplace name-uniqueness, **not** because the plugin is umbraculum-specific.

This plugin is one of the four umbraculum-toolset Cursor plugins. The companion `umbraculum-platform-tsjs-cursor-assistant` plugin sits on top of it with umbraculum-platform-specific artifacts (multi-tenant workspace-scoped patterns, the four-slice foundation-hardening discipline); this plugin contains only ecosystem-generic guidance and is safe to install on its own (alongside `umbraculum-toolset-common`) in non-umbraculum TS/JS projects.

## Contents

- `rules/*.mdc`: Node/TypeScript/React/E2E and shared workflow guardrails.
- `skills/*/SKILL.md`: bounded runbook skills for Node, Playwright/E2E, browser checks, containers, and test-MCP patterns.
- `agents/*.md`: focused Cursor agents for Playwright smoke and general verification.
- `docs/templates/DEVELOPMENT-LOCAL.md`: optional repo-local addendum template.
- `docs/templates/BUGBOT.md`: TS-specific Cursor Bugbot review rules (bootstrap to `<REPO_ROOT>/.cursor/BUGBOT.md`).

Portable Bugbot/Loop **policy** lives in **`umbraculum-toolset-common` v0.0.3+** — rules 56/57, architecture docs, `ci-watch-loop` skill, generic LOOP template.

## Bugbot (checks only)

Opt-in via `.cursor/BUGBOT.md`. Local: `typescript-bugbot-review` or `/review-bugbot` (master-gated). Policy: toolset-common `56-bugbot-checks-only.mdc`.

## Loop (read-only CI watch)

Opt-in via `.cursor/LOOP.md` (bootstrap from toolset-common `docs/templates/LOOP.md`). Skill: `ci-watch-loop`. Policy: toolset-common `57-loop-readonly-guardrails.mdc`.

## Notable rules

- `00-shared-monorepo-package-boundary.mdc`
- `00-shared-node-npm-container-only.mdc`
- `22-typescript-contracts-runtime-validation.mdc`
- `23-eslint-flat-config-hygiene.mdc`
- `23a-eslint-fixall-discipline.mdc`
- `24-react-accessibility-first.mdc`
- `26-typescript-strict-flags.mdc`
- `67-playwright-quick-gates-before-run.mdc`
- `40-workflow-and-navigation.mdc`
- `44-tsjs-project-docs-first.mdc`
- `51-restart-dev-server-after-git-tree-mutations.mdc`
- `73-website-static-build-before-preview.mdc`
- `78-native-expo-doctor-monorepo-gate.mdc`
- `79-tamagui-cli-monorepo-gate.mdc` (`alwaysApply: true`; umbraculum-dev also commits a repo-side copy under `.cursor/rules/` for enforcement)
- `80-monorepo-lockfile-agent-gate.mdc` (`alwaysApply: true`; umbraculum-dev repo-side copy; agent-owned root lockfile regen + forbidden `services/api/package-lock.json`)
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

Install via the `workspaceOpen` hook + source paths (see toolset [cursor-plugins/README.md](../README.md) and [docs/WORKSPACE-PLUGIN-LOADING.md](../docs/WORKSPACE-PLUGIN-LOADING.md)). Legacy global rsync: `install-local.sh.legacy`.

## Notable skills

- `runtime-commands-containers`
- `node-npm-container-only`
- `build-workspace-packages-dist-in-container`
- `npm-workspaces-package-lock-invalid-version`
- `playwright-runner-docs-gate`
- `agentic-browser-web-app`
- `test-mcp-server`
- `native-expo-doctor-pre-push`
- `tamagui-cli-check`
- `monorepo-lockfile-gate`
- `typescript-bugbot-review` — opt-in local pre-push Bugbot (master-gated, readonly)

## Agents

- `e2e-smoke`
- `verifier`
- `contracts-zod-auditor`

## Version history

- **0.0.13** (2026-11) — Rule `67` globs match rule `60` (`apps/web/e2e/**` + `playwright.config.*`); drop stray `e2e/playwright/**`.
- **0.0.12** (2026-11) — Rule `67-playwright-quick-gates-before-run`: hard stops resolve from project E2E docs (umbraculum-class probes as examples only); align with `playwright-runner-docs-gate`.
- **0.0.11** (2026-11) — Finish Magento scrub: `05-host-no-rm`, `cursor-tmp-scripts-and-logs`, `allowlist-docker-exec-strategy`, `noninteractive-allowlist-fallback` use `<APP_CONTAINER>` / TS paths; `playwright-runner-docs-gate` Step 0 is project-doc-driven with umbraculum-class examples only.
- **0.0.10** (2026-11) — **TS/JS only:** delete Magento residue (`21-preferences…`, `30-e2e-no-hardcoded-paths`, `66-experimental-agentic-e2e`, skill `agentic-e2e-runbook`). Rewrite `runtime-commands-containers`, `playwright-runner-docs-gate`, `e2e-smoke` agent for Node/compose/Playwright. Rewrite rule `52-verify-url-exceptions-via-curl` + skill `curl-exception-verification` (no PHP/`setup:di:compile`). Magento workspaces use `umbraculum-toolset-common` + Magento plugins — never this plugin.
- **0.0.9** (2026-11) — Path B expo-doctor / Expo SDK **58** + React **19.3.0** (rule `78` + skill `native-expo-doctor-pre-push`). Align umbraculum-dev **1.0.0 testing** stack guidance: default one-shot / ci-parity image **`node:22-slim`**; DEVELOPMENT-LOCAL template for compose + Tamagui 3 / Expo 58.
- **0.0.8** (2026-07) — Bugbot/Loop: TS `docs/templates/BUGBOT.md`, `typescript-bugbot-review` skill; Bugbot/Loop workflow sections in `40-workflow-and-navigation.mdc`. Portable policy in toolset-common v0.0.3+.
- **0.0.7** (2026-06-11) — Monorepo lockfile agent gate: rule `80-monorepo-lockfile-agent-gate.mdc` + skill `monorepo-lockfile-gate` (agent-owned root lockfile regen in container Node image, forbidden `services/api/package-lock.json`, `npm run check:lockfiles`). umbraculum-dev commits repo-side `.cursor/rules/` copy + `verify-slice` T2 always runs lockfile checks in validate.
- **0.0.6** (2026-06-10) — Tamagui duplicate-instance gate: rule `79-tamagui-cli-monorepo-gate.mdc` + skill `tamagui-cli-check` (`npx @tamagui/cli check` via consuming-repo `scripts/check-tamagui-cli.sh`). umbraculum-dev commits a repo-side `.cursor/rules/` copy because plugin `alwaysApply` enforcement is unreliable.
- **0.0.3** (2026-05-27) — Static brochure guardrail: rule `73-website-static-build-before-preview.mdc` (glob-scoped to `apps/website/public/**`); rebuild `dist/` before preview/verification after `public/` edits.
- **0.0.2** (2026-05-27) — Playwright quick gates: rule `67-playwright-quick-gates-before-run.mdc` (glob-scoped to `apps/web/e2e/**` and `e2e/playwright/**`); `playwright-runner-docs-gate` skill expanded with mandatory stack-health gate block, Umbraculum one-shot Docker template, and MRP/CRP export troubleshooting pointers (repo docs remain canonical SoT).
- **0.0.1** (2026-05-25) — public baseline after the repository history reset. Includes the current Node/TypeScript/React/E2E rules, skills, and verifier agents, plus the companion-plugin split with `umbraculum-toolset-common`.
