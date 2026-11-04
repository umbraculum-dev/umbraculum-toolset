# umbraculum-toolset-common — design notes

## Why this plugin exists

The three domain plugins (`umbraculum-node-react-cursor-assistant`, `umbraculum-platform-tsjs-cursor-assistant`, `umbraculum-openplc-python-cursor-assistant`) carry copies of the same meta-framework rules — guardrails that are language-agnostic and govern how rules, skills, and subagents themselves are authored. The duplication was tolerable at three plugins; it's a maintenance hazard as soon as one of those rules evolves and the copies drift.

This plugin holds the rules and skills where the **core principle is shared across all consumers AND the per-ecosystem differences are trivial enough to neutralize without losing tone or accuracy**.

As of 2026-07, **Bugbot and Loop portable policy** (architecture docs, rules 56/57, `ci-watch-loop` skill, generic `templates/LOOP.md`) lives here. Domain plugins supply only ecosystem-specific `templates/BUGBOT.md` and thin `*-bugbot-review` skills — they must not duplicate common policy files.

## Why this plugin is intentionally small

The original `PLUGIN-ROADMAP.md` § 2 anticipated ~12 rules moving here. The actual count is **3 rules + 1 skill**. The reason is captured by the refactor's Strategy C decision: **only truly-identical (or trivially-different) artifacts move to common; rules with substantive plugin-specific additions stay in their plugins.**

When we audited the 12 candidate rules pairwise (node-react vs openplc), all 12 had at least minor per-ecosystem text. Most had substantive additions:

| Rule | Difference | Outcome |
|---|---|---|
| `00-development-local-addendum-gate.mdc` | 2-line example list difference | **moved** (neutralized examples) |
| `12-skill-contract.mdc` | example placeholder + JS/TS globs | **moved** (neutralized examples, alwaysApply: true) |
| `41-commit-message-ticket-prefix.mdc` | example commit text + 1 cross-reference paragraph | **moved** (neutralized) |
| `00-workflow.mdc` | different "before any work" preambles | stayed (substantive) |
| `05-host-no-rm.mdc` | openplc adds "Specifically forbidden in this project" PLC-source list | stayed |
| `13-rule-skill-authoring-gate.mdc` | openplc adds "Domain-specific authoring nudges" | stayed |
| `14-subagent-contract.mdc` | openplc adds Modbus-write anti-patterns | stayed |
| `15-subagent-delegation-guardrails.mdc` | openplc adds extensive PLC-source/Modbus guardrails | stayed |
| `42-merge-conflicts-no-behavior-change.mdc` | openplc adds `pous/programs/main.ld` ladder-graph caveat | stayed |
| `96-blocked-edit-tee-fallback.mdc` | openplc adds binary-file note | stayed |
| `97-plans-must-include-canonical-absolute-paths.mdc` | very different "Special rule for X" sections at bottom | stayed |
| `98-python-dir-listing-over-glob.mdc` | openplc adds build-pipeline-specific context | stayed |

Forcing the "stayed" rules into a neutral common copy would erase the per-ecosystem tone (PLC source caveats, Modbus warnings, ladder-graph notes) that makes them useful in practice. Acceptable cost: when a meta-framework principle in one of these evolves, both plugin copies must be updated.

## In-scope vs out-of-scope for future additions

In scope (default: add here):

- New meta-framework principles that govern how Rules, Skills, or Subagents are authored.
- Cross-ecosystem discipline that's identical (or trivially neutralizable) across TS/JS, Python, and PLC contexts.

Out of scope (default: add to the relevant domain plugin):

- Anything ecosystem-specific (TS/JS, Python, PLC, OpenPLC, Modbus, Prisma, Playwright, FastAPI, PHP frameworks, etc.).
- Anything project-specific (umbraculum-dev's foundation-hardening narrative, the brewery project's vessel IDs, etc.).
- Templates that prescribe ecosystem-specific values (each plugin ships its own `docs/templates/DEVELOPMENT-LOCAL*.md`).

### Why PHP / Mage-OS / commerce stacks stay out of common

`umbraculum-toolset-common` is intentionally the **only** umbraculum-toolset plugin many maintainers load in non-JS workspaces (git/DCO/co-author, commit ticket prefix, DEVELOPMENT-LOCAL gate, Bugbot/Loop **policy**). That does **not** make common a place for PHP / Mage-OS Admin journey packs, DI compile, reindex, theme tooling, or storefront catalog recipes.

Those concerns are ecosystem-specific: they need domain tone (object manager vs Fastify routes, Admin forms vs SPA screens, Composer vs npm). Strategy C says: if the text is not trivially neutralizable across TS/JS, Python/PLC, **and** PHP stacks, it stays in a **domain** plugin (sibling Mage-OS / PHP plugins live outside this marketplace pack). Putting PHP/Mage-OS-shaped runbooks in common would:

1. Inject wrong guardrails into umbraculum-dev and OpenPLC sessions (context noise).
2. Duplicate what a PHP domain plugin already owns.
3. Make “common” stop being common — every stack would start dumping recipes here.

Allowed in common: stack-agnostic principles (“curl 200 ≠ UI done”, “verify the running endpoint”, “domain `*-bugbot-review` skill”). Naming a specific Mage-OS/PHP CLI, Admin skill, or sibling plugin path is **out of scope** here; point at “domain skill / project `flows/`” instead. The multi-workspace hook may *load* common on a Mage-OS path as an example of “not only React” — it must not teach Mage-OS recipes inside this plugin.

If in doubt, prefer the domain plugin — promotion to common is cheap; demotion back is expensive.

## Why no `plugin.json` dependency field

Cursor's plugin loader does NOT consume any dependency / requires / recommends / extends field from `plugin.json`. Verified by enumerating the loader's destructure in the unpacked Cursor binary: only `displayName`, `description`, `authorName`, `variablesSchema`, `skills`, `rules`, `agents`, `commands`, `mcpConfig`, `hooks` are read. The marketplace-published plugins (Elastic, Figma, Prisma) confirm the same — none declares a dependency.

Therefore: "install `umbraculum-toolset-common` alongside this plugin" is documented in each plugin's README and (locally) enforced by the `workspaceOpen` hook (`cursor-plugins/docs/WORKSPACE-PLUGIN-LOADING.md`). On the marketplace it will be a per-listing description note. Same UX both ways → marketplace-portable from day one, no future refactor.

## Versioning

This plugin started its public baseline at `0.0.1` with the rest of the repository. Patch releases are independent when only common-plugin content changes (current HEAD may be ahead of domain plugins). Major-version cadence should stay synchronized across the apparatus trio so the install matrix stays predictable; do not require every plugin to share the same `0.0.x` patch.
