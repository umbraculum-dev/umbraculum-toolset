# umbraculum-toolset-common

Common meta-framework rules + skills shared by the umbraculum-toolset Cursor plugins.

This plugin is **not stand-alone**. It carries language- and domain-agnostic discipline that the three domain plugins (`umbraculum-node-react-cursor-assistant`, `umbraculum-platform-tsjs-cursor-assistant`, `umbraculum-openplc-python-cursor-assistant`) all need. Install it alongside any of them — never by itself.

## What's in it

### Rules

- `00-development-local-addendum-gate.mdc` — read repo-root `DEVELOPMENT-LOCAL.md` (and sibling `DEVELOPMENT-LOCAL-OLLAMA.md`) on session start; route to the `generate-development-local` skill on explicit user request when `DEVELOPMENT-LOCAL.md` is absent.
- `01-edit-plugin-source-not-installed-mirror.mdc` — always-on guardrail; never edit Cursor plugin files under the installed mirror (`~/.cursor/plugins/local/`); switch to the plugin source repo first.
- `12-skill-contract.mdc` — the Skill Contract that all plugin Skills must follow (input-driven, output-constrained, bounded — max 5 commands).
- `41-commit-message-ticket-prefix.mdc` — commit-message ticket-prefix discipline.
- `42-dco-signoff-gate.mdc` — before committing in a DCO-required project, verify a `Signed-off-by:` auto-append mechanism is in place (per-clone `.git/hooks/prepare-commit-msg`, or `core.hooksPath` + committed hook, or sustained `git commit -s`); if missing, stop and instruct the developer with the canonical install command. Critically corrects the common `format.signOff = true` misconfiguration trap.
- `43-non-frontier-executor-fitness-tracker.mdc` — when drafting a plan that will be handed to a non-frontier AI executor (e.g. `composer-2.5-fast`, Cursor-fast variants, future local models), OR when executing such a plan, read the repo's `docs/NON-FRONTIER-EXECUTOR-FITNESS-TRACKER.md` first (particularly §10 lessons for plan authors + §6.x per-run FAIL patterns). Reading-order rule; informational when the tracker file is absent.
- `44-agent-commit-cursor-coauthor.mdc` — after every `git commit` made from an agent tool call, verify that BOTH `Signed-off-by:` AND `Co-authored-by: Cursor <cursoragent@cursor.com>` trailers are present via `git log -1 --format='%(trailers:only=true)'`. The Co-authored-by trailer is the project's mechanism for honest AI-assistance attribution (per umbraculum MANIFESTO §1.2); it is auto-injected by the project's `prepare-commit-msg` hook when `CURSOR_AGENT=1` is exported (Cursor exports this env var into every agent tool-call shell, verifiable with `env | grep -i cursor`). If either trailer is missing, the agent surfaces the misconfiguration to the user rather than silently proceeding with a misattributed commit. Pairs with rule 42 (DCO sign-off gate) — both trailer concerns are enforced by the same hook.
- `45-public-endpoint-verification.mdc` — after any non-doc change to a service with a reachable URL/API, verify against the running endpoint before declaring done; passing tests are not sufficient evidence.

### Skills

- `generate-development-local` — bootstraps a per-developer `DEVELOPMENT-LOCAL.md` from the project's `DEVELOPMENT.md` (and `DEVELOPMENT-LOCAL-OLLAMA.md` if present) on explicit user request. The consuming plugin's `docs/templates/DEVELOPMENT-LOCAL*.md` template is the canonical shape.

## What's NOT in it

These rules are also "duplicated" across the three domain plugins, but each plugin has substantive domain-specific additions that would be lost if forced into a single neutral common copy. They stay in each plugin by design:

- `00-workflow.mdc`, `05-host-no-rm.mdc`, `13-rule-skill-authoring-gate.mdc`, `14-subagent-contract.mdc`, `15-subagent-delegation-guardrails.mdc`, `42-merge-conflicts-no-behavior-change.mdc`, `96-blocked-edit-tee-fallback.mdc`, `97-plans-must-include-canonical-absolute-paths.mdc`, `98-python-dir-listing-over-glob.mdc`.

See [docs/DESIGN-NOTES.md](docs/DESIGN-NOTES.md) for the rationale (Strategy C — only move what's safely neutralizable; keep ecosystem-specific tone where it matters).

## Witness-rule contract

See the toolset-level [cursor-plugins/README.md](../README.md) § "Witness-rule contract for downstream `AGENTS.md` consumers" for how downstream `AGENTS.md` files should reference rules from this and the domain plugins (and why some rules — those with `alwaysApply: false` or restrictive `globs:` — are unsuitable as introspectable witnesses and require a `Read`-based verification path instead).

## Install

This plugin uses the same local-install mechanism as the other three. The `cursor-plugins/scripts/install-local.sh` at the toolset root installs all four plugins at once into `~/.cursor/plugins/local/`. See the toolset-level [cursor-plugins/README.md](../README.md) for the canonical install instructions and the pairing matrix.

## Dependencies

Cursor's `plugin.json` manifest does NOT support a dependency / requires / recommends field (loader-source-verified — see `cursor-plugins/docs/PLUGIN-ROADMAP.md` § 1b and § 2). Inter-plugin "install alongside X" recommendations are therefore README-level only, both today and after marketplace publishing.

If you install `umbraculum-toolset-common` without any of the domain plugins, nothing will break — the rules and skill simply load in isolation. They just won't see the domain-specific examples that make them concretely useful.
