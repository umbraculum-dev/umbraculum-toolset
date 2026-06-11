# Umbraculum Toolset — Cursor plugins

This directory packages four Cursor plugins in a multi-plugin repository:

- **`umbraculum-toolset-common`** — small shared plugin that carries the language-agnostic meta-framework rules (DEVELOPMENT-LOCAL gate, Skill Contract, commit-message ticket-prefix discipline) and the `generate-development-local` skill. Install alongside any of the three domain plugins below. Not stand-alone — see [umbraculum-toolset-common/README.md](umbraculum-toolset-common/README.md).
- **`umbraculum-node-react-cursor-assistant`** — generic Node/TypeScript/React/E2E Cursor assistant. Suitable for any TS/JS project; encodes ecosystem-wide guardrails (lint hygiene, contracts/runtime-validation, accessibility, Playwright runner conventions, container-only Node/npm discipline, etc.).
- **`umbraculum-platform-tsjs-cursor-assistant`** — umbraculum-platform-specific Cursor assistant. Encodes the four-slice foundation-hardening discipline (lint + types + tests + docs) closed in umbraculum-dev on 2026-05-18, plus the umbraculum-specific architectural patterns (multi-tenant workspace-scoped routes, `scripts/docs/check-readmes.py` structural-README checker, dockerized typecheck pattern, `@brewery/*` → `@umbraculum/*` package-scope rename discipline).
- **`umbraculum-openplc-python-cursor-assistant`** — OpenPLC + Python + FastAPI + Modbus + hardware-doc Cursor assistant for the industrial-automation sister-repo (`/path/to/openplc-brewery-project/`). Encodes the IEC-61131-3 source-vs-build discipline, the `PI_*` Modbus mailbox contract, the FastAPI/Jinja/SQLite Pi-sidecar conventions, the bench-vs-field transport profile distinction, the hardware-doc filename-suffix + scope-tag taxonomy, and the EM-fields pamphlet ASCII-diagram authoring rules.

Multi-plugin discovery is defined in `.cursor-plugin/marketplace.json`.

**Sibling npm tooling (not a Cursor plugin):** [`packages/ci-parity`](../packages/ci-parity/) ships **`@umbraculum/ci-parity`** — manifest-driven local/CI **static-analysis** parity. Consumer repos pin `.umbraculum/ci-parity.json` and call `npx @umbraculum/ci-parity`; the node-react plugin's rule `72-ci-parity-local-vs-ci-divergence` and skill `ci-parity-local-reproduction` reference it. The GHA **`api`** vitest workflow is **out of ci-parity scope** — use skill **`api-integration-tests-pre-push`** and rule **`75-api-integration-pre-push-gate`**.

See `docs/PLUGIN-ROADMAP.md` for: (a) the rationale for the common plugin and what was deliberately NOT moved into it (Strategy C — only the trivially-neutralizable artifacts moved), and (b) the private-vs-marketplace (Cursor) plugin transition notes if any of these ever needs to be published publicly.

## Install

### Goto procedure (until Marketplace publication)

**[`docs/WORKSPACE-PLUGIN-LOADING.md`](docs/WORKSPACE-PLUGIN-LOADING.md)** — canonical step-by-step install: clone source repos, create `~/.cursor/hooks.json` + `register-workspace-plugins.sh`, keep `~/.cursor/plugins/local/` empty, **manually reload Cursor**, verify per-workspace plugin list in Settings → Plugins.

Official Cursor reference: [`workspaceOpen` hook](https://cursor.com/docs/hooks#workspaceopen) — per-workspace `pluginPaths` on workspace open.

Do **not** use `install-local.sh.legacy` for normal installs — it globalizes all four umbraculum plugins. Use the hook so each workspace gets only the plugins it needs (verified: umbraculum-dev vs OpenPLC brewery vs Magento example workspace show different Installed lists).

After `git pull` here: **Developer: Reload Window** in affected workspaces (manual; no rsync).

### Workspace pairing summary

| Workspace | Plugins (from source via hook) |
|---|---|
| `/path/to/umbraculum-dev` | `umbraculum-toolset-common` + `umbraculum-node-react-cursor-assistant` + `umbraculum-platform-tsjs-cursor-assistant` |
| OpenPLC brewery repo | `umbraculum-toolset-common` + `umbraculum-openplc-python-cursor-assistant` |
| Magento under `/path/to/magento-workspace/` | `umbraculum-toolset-common` + `rf-magento-cursor-assistant` (from cursor-plugins source) |
| Everything else | `umbraculum-toolset-common` only |

Keep `~/.cursor/plugins/local/` **empty** for umbraculum and rf-magento plugins — anything there loads in every workspace regardless of the hook.

### Legacy: global rsync into `~/.cursor/plugins/local/`

Superseded by the hook approach above. Retained for rollback only:

```bash
bash cursor-plugins/scripts/install-local.sh.legacy
```

That script `rsync`s all four umbraculum plugins into `~/.cursor/plugins/local/` (global load). See `docs/PLUGIN-ROADMAP.md` §1b for why symlinks do not work. Do not run the legacy installer alongside the hook unless you are rolling back.

### Per-project enablement

With workspace-scoped hook loading, the pairing matrix below is enforced by `~/.cursor/hooks/register-workspace-plugins.sh`. Additional levers:

- **Component-level toggles** in **Cursor Settings → Rules** (rules individually) and **Settings → Features → MCP** (MCP servers individually). Mute specific rules when a plugin is loaded but some guidance should be off for a project.
- **Marketplace plugins** (Figma, Prisma, Elastic, …) still apply per their own `state.vscdb` toggles.

The pairing matrix:

   - **Any TS/JS project** → `umbraculum-toolset-common` + `umbraculum-node-react-cursor-assistant`.
   - **umbraculum-dev (or any umbraculum-platform project)** → `umbraculum-toolset-common` + `umbraculum-node-react-cursor-assistant` + `umbraculum-platform-tsjs-cursor-assistant`. The platform-tsjs plugin depends on conventions also covered by the generic node-react one; both must be active.
   - **`/path/to/openplc-brewery-project/`** (or any future OpenPLC + Python + Modbus + hardware-doc project that adopts the same five surfaces) → `umbraculum-toolset-common` + `umbraculum-openplc-python-cursor-assistant`. This plugin does NOT pair with the two TS/JS plugins.

### Git repo install

Once published to a Git remote, install from the Git URL in Cursor (Settings → Plugins → install from URL, or via a Team Marketplace import on Teams/Enterprise). Update by pulling + reloading.

### CLI install

Cursor does **not** currently expose a `cursor` or `cursor-agent` subcommand for plugin install/update/list. Local install is the `workspaceOpen` hook + source paths described in [`docs/WORKSPACE-PLUGIN-LOADING.md`](docs/WORKSPACE-PLUGIN-LOADING.md), followed by **Developer: Reload Window** in Cursor. Legacy global rsync: `install-local.sh.legacy`.

## Plugin pairing — which plugins together?

| Project type | Install |
|---|---|
| Generic TS/JS / React | `umbraculum-toolset-common` + `umbraculum-node-react-cursor-assistant` |
| Umbraculum-platform (umbraculum-dev) | `umbraculum-toolset-common` + `umbraculum-node-react-cursor-assistant` + `umbraculum-platform-tsjs-cursor-assistant` |
| OpenPLC + Python sister-repo (openplc/brewery) | `umbraculum-toolset-common` + `umbraculum-openplc-python-cursor-assistant` |
| Magento (`/path/to/magento-workspace/…`) | `umbraculum-toolset-common` + `rf-magento-cursor-assistant` (hook registers both from source; Magento plugin lives outside this repo) |

### Recommended third-party plugins (not shipped here)

Cursor's loader does **not** support manifest-level `dependsOn` / `recommends`
(see [`docs/PLUGIN-ROADMAP.md`](docs/PLUGIN-ROADMAP.md) §1b / §5). Pairings
above are enforced in README + installer only. For **umbraculum-dev** and
other Prisma monorepos in the family, we additionally **warmly advise**:

| Plugin | Source | Required? | Notes |
|--------|--------|-----------|--------|
| **Prisma** (official) | Cursor Marketplace (publisher: Prisma) | **No** — not a witness in downstream `AGENTS.md` | MCP (Local/Remote), migration + schema rules, CLI skills. Complements platform rule `47-prisma-multischema-module-schemas.mdc`. Install procedure: consuming repo [`docs/CURSOR-PLUGINS.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CURSOR-PLUGINS.md) §"Strongly recommended — Prisma" (umbraculum-dev). |

Every domain plugin requires `umbraculum-toolset-common`. The common plugin carries the language-agnostic meta-framework artifacts (`00-development-local-addendum-gate.mdc`, `12-skill-contract.mdc`, `41-commit-message-ticket-prefix.mdc`, `skills/generate-development-local/`). Each domain plugin keeps the meta-framework rules whose ecosystem-specific additions (PLC source caveats, Modbus-write anti-patterns, ladder-graph merge notes, etc.) are too substantive to neutralize — see `docs/PLUGIN-ROADMAP.md` § 2 and `umbraculum-toolset-common/docs/DESIGN-NOTES.md` for the Strategy C analysis.

The `umbraculum-platform-tsjs-cursor-assistant` ASSUMES the generic `umbraculum-node-react-cursor-assistant` plugin is also active (it omits the TS/JS ecosystem rules; the generic plugin provides them).

Cursor's `plugin.json` does NOT support a manifest-level dependency / requires / recommends field (loader-source-verified — see `docs/PLUGIN-ROADMAP.md` § 1b and § 5). Pairings are therefore enforced at the README + installer level, both today and after marketplace publishing.

## Update and versioning

- The public repository baseline starts at `v0.0.1`.
- One folder per plugin (no per-version folders).
- Keep each plugin's `.cursor-plugin/plugin.json` `version` aligned with the repository baseline for coordinated releases.
- For coordinated releases that touch multiple plugins, bump all affected plugin versions in the same commit and tag once at the toolset level (for example, `vX.Y.Z`).
- If a plugin later ships independently, use a plugin-prefixed Git tag in addition to the plugin manifest version so consumers can identify that plugin-specific release.

## Rule scoping (`globs`)

Rules use frontmatter `globs` so guidance is loaded by ecosystem/context.

- The common plugin's rules are language-agnostic and `alwaysApply: true` (no `globs`) — they govern session-start gating, the Skill Contract, and commit-message discipline regardless of file type.
- The generic TS/JS plugin's rules target TS/JS file patterns broadly.
- The umbraculum-platform-tsjs plugin's rules target a narrower set (the umbraculum monorepo's `apps/*`, `services/*`, `packages/*` workspace layout).
- The OpenPLC + Python plugin's domain rules target the openplc/brewery surfaces (`pous/**`, `pi-sidecar/**`, `docs/**`, `docs/reference/em-fields-pamphlet/**`); its meta-framework rule copies that stay locally (the 9 with substantive PLC/Python-specific additions) are `alwaysApply: true` without JS/TS globs.

When multiple plugins are enabled on the same project (common + a domain plugin, or common + node-react + umbraculum), the `globs` reduce cross-talk and Cursor's context cost.

## Witness-rule contract for downstream `AGENTS.md` consumers

Consuming repos (e.g. `umbraculum-dev`) typically install an `AGENTS.md` at repo root that performs an "apparatus self-check" on session start: the agent introspects its own loaded rule set and looks for a designated **witness rule** from each required plugin to confirm the plugin is installed and active.

The witness-rule choice matters, because rules in this toolset fall into two activation categories — and only one of them can be reliably verified by rule-list introspection in every conversation.

### Two activation categories

- **Unconditional** — `alwaysApply: true` in frontmatter, with no `globs:` (or with `globs:` that `alwaysApply: true` overrides; verified empirically against the loader's behavior). Cursor loads these into the agent's context in every conversation regardless of which files are open. **Suitable as introspectable witnesses.**

- **Conditional** — `alwaysApply: false`, scoped via `globs:` to specific file patterns (e.g. `apps/**/*.{ts,tsx,js,jsx}`). Cursor only auto-attaches these when a matching file is in the conversation's active context. They are **silently absent** from the agent's loaded rule list in conversations with no matching file open, even when the plugin is correctly installed on disk. **NOT suitable as introspectable witnesses.** They MUST be verified by an alternate mechanism — typically by instructing the agent to attempt a `Read` of the rule's canonical path on disk. With the recommended hook install, that path is the **source clone** (example: `$UMB_BASE/umbraculum-node-react-cursor-assistant/rules/<rule>.mdc` where `UMB_BASE` is your `umbraculum-toolset/cursor-plugins` directory). Legacy global rsync or marketplace cache installs use `~/.cursor/plugins/local/<plugin-name>/rules/<rule>.mdc` or the marketplace cache path instead. A successful Read both confirms the file is present on disk *and* brings the rule's full content into the conversation, functionally identical to auto-attach for rule-enforcement purposes.

### Authoring guidance for downstream `AGENTS.md`

When authoring or updating the witness-rule table in a downstream `AGENTS.md`, confirm each chosen witness rule's category by inspecting its frontmatter:

```bash
# Hook install (recommended): source clone
head -10 "$UMB_BASE/<plugin-name>/rules/<witness-rule>.mdc"

# Legacy global rsync only:
head -10 ~/.cursor/plugins/local/<plugin-name>/rules/<witness-rule>.mdc
```

If `alwaysApply: false` or restrictive `globs:` are present, treat the witness as conditional and document the Read-based verification path in the `AGENTS.md` self-check section.

### Anti-pattern: do not "fix" a conditional witness by flipping `alwaysApply`

When a conditional witness rule appears missing from a fresh agent conversation's rule list, the wrong fix is to flip the rule's frontmatter to `alwaysApply: true` to "make the witness check pass". That change exports the rule's content (often project-specific, like umbraculum's RFC-0003 Zod-v4 doctrine) into every Cursor conversation in every workspace on the developer's machine, including non-umbraculum projects that share the same Cursor install. **The activation category is a property of what the rule's content scopes to, not a workaround for the witness check.**

If a plugin needs a stable, always-introspectable witness, prefer one of the plugin's `alwaysApply: true` rules whose content is generic enough that always-loading it is not a context tax (e.g. delegation guardrails, session-start gates, plugin-pack identification banners). Conditional rules whose content is genuinely file-scoped (TS/JS contract validation, ESLint flat-config hygiene, SCSS comment discipline, OpenPLC variable-prefix conventions) should remain conditional and be verified by the Read-based mechanism described above.

### Today's witness-rule registry (this toolset)

| Plugin | Witness rule | Category |
|---|---|---|
| `umbraculum-toolset-common` | `00-development-local-addendum-gate.mdc` | unconditional |
| `umbraculum-node-react-cursor-assistant` | `22-typescript-contracts-runtime-validation.mdc` | conditional |
| `umbraculum-platform-tsjs-cursor-assistant` | `02-foundation-hardening.mdc` | unconditional |
| `umbraculum-openplc-python-cursor-assistant` | _(not yet declared; downstream `AGENTS.md` files in OpenPLC consumers should choose an `alwaysApply: true` rule from the plugin's `rules/` directory and add it here when they wire up an apparatus self-check)_ | _(future)_ |

If a plugin author renames or recategorizes a witness rule (e.g. promoting a conditional rule to unconditional, or renaming the file), bump the plugin's `version` in its `.cursor-plugin/plugin.json`, update this table, and notify downstream `AGENTS.md` maintainers — the contract here is part of the plugin's public surface area.

## Repo-side fallback for unenforced `alwaysApply` rules (work-in-progress; consistency-first)

The Umbraculum project's stance is **plugins are the canonical home for rules, skills, and subagents** — see this document's framing above and every consuming repo's `AGENTS.md` apparatus self-check. The witness-rule contract above is how downstream `AGENTS.md` files confirm the plugin pack is loaded; it is the **presence verification** layer.

However, **the project explicitly treats plugin-level `alwaysApply: true` enforcement as work-in-progress**. We do not yet know to what extent Cursor reliably auto-attaches *and acts on* every `alwaysApply: true` rule from an installed plugin across every session, every Cursor build channel, every agent runtime (Cursor Desktop, Cursor CLI, Cloud Agents, future Cursor variants), and every interaction mode. The witness-rule contract above proves the rule is *loaded*; it does not prove the rule's directives are *honored* by the agent. This is an empirical gap, not a theoretical one — episodic reports from sister repos motivate this section (e.g. a 2026-05-21 triage in a Magento-touching agent session that surfaced an `alwaysApply: true` rule's directives being silently ignored despite the rule being correctly listed in the agent's loaded rule set).

### The consistency-first fallback

If a developer observes that a specific `alwaysApply: true` rule from one of the toolset plugins is not being enforced reliably on a given project — i.e. the rule is present in the agent's loaded rule list per the witness-rule check, but the agent is observably failing to honor its directives — the **immediate fix is to copy the rule into the consuming repo's `.cursor/rules/` directory**:

```bash
mkdir -p <repo>/.cursor/rules
# Hook install (recommended): copy from source clone
cp "$UMB_BASE/<plugin-name>/rules/<rule>.mdc" \
   <repo>/.cursor/rules/<rule>.mdc
# Legacy global rsync: ~/.cursor/plugins/local/<plugin-name>/rules/<rule>.mdc
cd <repo>
git add .cursor/rules/<rule>.mdc
git commit -m "chore(.cursor/rules): copy <rule>.mdc from <plugin-name> as enforcement fallback"
```

Properties of the fallback:

- **COPY, not move.** The plugin copy stays put. The repo copy is additive; sister repos that install the same plugin still receive the rule via the plugin, and your repo also gets it via the repo-committed copy. If Cursor de-duplicates rules by filename across plugin + repo sources (open question; see `docs/PLUGIN-ROADMAP.md` §5), the worst case is one redundant load — a context-cost trade we explicitly accept.
- **Do not refactor.** The repo copy is a verbatim duplicate of the plugin file's content at the moment of the copy. Do not change the rule's content, frontmatter, scope, or wording. The point of the fallback is to preserve consistency with the plugin source-of-truth, not to fork it.
- **Do not delete the plugin copy.** The plugin remains the canonical source. The repo copy is a *consistency fallback* against an environmental enforcement gap, not a *replacement*.
- **Report the enforcement gap to the plugin core team — this is load-bearing.** Open an issue against the umbraculum-toolset repo (<https://github.com/umbraculum-dev/umbraculum-toolset/issues>) describing: which rule, which plugin, which consuming repo, which Cursor build (Help → About in Cursor Desktop; `cursor --version` for the CLI), which agent runtime, what the rule said the agent should do, what the agent did instead, and how you verified the rule was loaded (witness-rule introspection output). The repo-side fallback restores consistency for *your* immediate session; **the issue report is the only way the plugin core team learns about the gap, accumulates evidence across reporters, and eventually closes it at the source**. Without the report, the fallback degrades into silent forking — every consumer fixes its own copy, the plugin pack never improves, and the enforcement gap becomes permanent by neglect.

### Boundaries

- **For `alwaysApply: true` rules only.** This fallback addresses enforcement failures on rules that are *already* unconditional in the plugin. Do NOT flip a conditional (glob-scoped) rule to `alwaysApply: true` to enable the fallback — that violates the witness-rule anti-pattern above. The conditional category is a property of the rule's content scope; the right tool for conditional rules is the Read-based verification mechanism the witness-rule contract documents, not this copy-to-repo recipe.
- **Not a substitute for the witness-rule contract.** This fallback addresses **enforcement** of rules whose presence in the agent's context has already been verified by the witness-rule contract. It is NOT a workaround for the **presence verification** problem. If the plugin is not installed, the apparatus self-check soft-blocks per the consuming repo's `AGENTS.md`; do not skip the soft-block by short-circuiting to the copy-to-repo fallback. The two mechanisms are complements: presence (witness-rule contract) + enforcement (this fallback) = a rule that both loads AND acts on the agent.
- **Apparatus override remains the right call for trivial cases.** For doc-only typos or one-line corrections where the apparatus would be overkill anyway, the `apparatus: override` mechanism documented in the consuming repo's `AGENTS.md` is preferable to setting up a fallback — the override is explicit, scoped to the single session, and leaves no repo-committed artifact behind.

### Deferred questions

This policy deliberately does NOT yet answer:

- *When does the repo-committed copy get deleted, and on what trigger?* (When Cursor fixes the enforcement gap on a verified build? When a Cursor version pin in a future `.cursor/required-plugins.json` proves stable? Never — accept permanent duplication as the cost of consistency?)
- *Should the repo copy and the plugin copy diverge over time?* (If yes, which is canonical and how is precedence signaled? If no, what tooling enforces parity, and on what cadence?)
- *Does the Umbraculum project ever migrate to a "rules in repo, only skills + subagents in plugins" architecture once the empirical record on Cursor's enforcement behavior is complete enough to make that call?*
- *How is the open issue tracker (<https://github.com/umbraculum-dev/umbraculum-toolset/issues>) triaged into evidence-grade enforcement-gap reports that the plugin team can act on at the source?*

These are real questions and the project owes them an answer eventually. The position taken here is that the consistency cost of an unenforced rule is high enough — and the evidence base for an informed architectural decision is thin enough — that the consistency-first fallback is the right immediate response while the project accumulates the empirical record needed to settle the deeper questions. Every issue report filed per the rule above adds to that record.

## DEVELOPMENT* files: ownership and on-demand bootstrap

Three files matter and they have different ownership:

| File | Owned by | Versioned where | Bootstrap |
|---|---|---|---|
| `DEVELOPMENT.md` | the consumer project | the project's main repo (git) | hand-written / project-specific |
| `DEVELOPMENT-LOCAL-OLLAMA.md` | the consumer project | the project's main repo (git) | hand-written / project-specific |
| `DEVELOPMENT-LOCAL.md` | the developer | typically gitignored | on-demand, via the `generate-development-local` skill (or hand-written) |

The plugins **do not auto-sync any of these files** into the workspace. The plugin-side hook API has no `workspaceOpen` event — only agent-action hooks (`preToolUse`, `beforeShellExecution`, etc.) — so true on-open file materialization is not currently possible. See `docs/PLUGIN-ROADMAP.md` § 1b for the hook-event audit.

### Gate behavior (rule `00-development-local-addendum-gate.mdc`)

The gate rule and the `generate-development-local` skill both live in `umbraculum-toolset-common`. They load when the `workspaceOpen` hook registers the common plugin for the workspace (every workspace gets at least common; domain plugins add path-specific extras).

- **At session/task start**, if repo-root `DEVELOPMENT-LOCAL.md` exists, the assistant reads it early. If sibling `DEVELOPMENT-LOCAL-OLLAMA.md` also exists, it is read alongside (same precedence). These files are the source of truth for project-specific parameters (containers, paths, ports, OpenPLC Runtime URLs, serial-port paths for the RTU field profile, E2E defaults, command constraints, Ollama model id / endpoint).
- **If `DEVELOPMENT-LOCAL.md` is absent**, the assistant proceeds normally and asks for project-specific values only when the requested task needs them.
- **On explicit user request** (e.g. "create my DEVELOPMENT-LOCAL.md", "bootstrap local context"), the rule routes the agent to the `generate-development-local` skill (in the common plugin). The skill reads `DEVELOPMENT.md` (and `DEVELOPMENT-LOCAL-OLLAMA.md` if present), fills in everything it can derive from the consuming domain plugin's `docs/templates/DEVELOPMENT-LOCAL*.md` template, asks for any remaining `<fill_me>` values, and writes the new `DEVELOPMENT-LOCAL.md` at repo root. It refuses to overwrite an existing `DEVELOPMENT-LOCAL.md` without explicit confirmation.

### Templates shipped per domain plugin

The common plugin holds the rule and the skill, but **NOT** the per-ecosystem `DEVELOPMENT-LOCAL.md` template — each domain plugin ships its own shape. The skill takes the consuming plugin's template as the canonical shape input:

- `umbraculum-node-react-cursor-assistant/docs/templates/DEVELOPMENT-LOCAL.md` — TS/JS-shape template.
- `umbraculum-openplc-python-cursor-assistant/docs/templates/DEVELOPMENT-LOCAL.openplc.example.md` — openplc/brewery-shape template.
- (`umbraculum-platform-tsjs-cursor-assistant` does not ship its own template; the umbraculum-platform projects use the TS/JS template from `umbraculum-node-react-cursor-assistant`.)

## Contributing checklist

- Rules have `description`, `alwaysApply`, and (when appropriate) `globs` frontmatter.
- Skills live at `skills/<skill-name>/SKILL.md` with `name` + `description` frontmatter; follow the Skill Contract (input-driven, output-constrained, bounded — max 5 commands).
- Agents live at `agents/<agent-name>.md` with the required agent frontmatter (`name`, `description`, `model`, `readonly` where appropriate); body ≤30 lines and MUST reference a canonical skill.
- No repo-specific hardcoded paths, container names, or URLs in artifacts (the marketplace-readiness gate enforces this — see `docs/PLUGIN-ROADMAP.md` § 3).
- Rule/agent docs reference Skills by skill name, not by `.cursor/skills/*.md` paths.
- Decide WHICH plugin a new artifact belongs to:
  - Language-agnostic meta-framework rules / skills that are trivially neutralizable across all ecosystems → `umbraculum-toolset-common/`. See its `docs/DESIGN-NOTES.md` for the in-scope / out-of-scope test.
  - Umbraculum-platform-specific TS/JS → `umbraculum-platform-tsjs-cursor-assistant/`.
  - Ecosystem-generic TS/JS → `umbraculum-node-react-cursor-assistant/`.
  - OpenPLC + Python + Modbus + hardware-doc → `umbraculum-openplc-python-cursor-assistant/`.
  - Meta-framework rules with substantive per-ecosystem additions → keep in each domain plugin (today: 9 such rules in `umbraculum-openplc-python-cursor-assistant`; see its README and `docs/PLUGIN-ROADMAP.md` § 2 for the exhaustive list and rationale).
  - If unsure, prefer the more domain-specific plugin and add a defensive "if the project has `docs/X.md`..." guard. Promotion to common is cheap; demotion back is expensive.
