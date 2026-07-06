# Bugbot review rules — Cursor plugin pack / meta repo

Feature work merges via PRs to **`master`**. Suggested flow: optional local `plugin-pack-bugbot-review` or `/review-bugbot` before push; on PR comment `bugbot run` for cloud review. Runtime verification remains GHA (when path-filtered) plus `CONTRIBUTING.md` discipline.

**Policy:** Report findings only. Do not suggest Autofix or auto-commits.

---

## Authoring taxonomy

- Flag new guidance that does not declare whether it is a **Rule**, **Skill**, or **Subagent** (see `13-rule-skill-authoring-gate.mdc` in domain plugins).
- Flag **rules** that contain procedural runbook steps — rules must be guardrails + pointers; procedure belongs in skills.
- Flag **skills** missing Skill Contract sections: Inputs required, Output format, Bounds (max 5 commands, no loops).
- Flag **subagents** missing contract frontmatter (`name`, `description` with delegation trigger, `model`), body longer than ~30 lines, or missing canonical skill pointer.

## Distribution hygiene

- Flag absolute maintainer paths in docs or examples (`/home/...`, developer-specific clone roots). Use `/path/to/...` or `<REPO_ROOT>` placeholders only.
- Flag edits targeting `~/.cursor/plugins/local/` mirror paths instead of the plugin **source repo** (`01-edit-plugin-source-not-installed-mirror.mdc`).
- Flag secrets, tokens, or private package URLs in plugin docs or manifests.

## Plugin manifest and release

- Flag changes under `cursor-plugins/*/` without a corresponding `.cursor-plugin/plugin.json` version bump when shipping plugin behavior.
- Flag invalid or malformed `plugin.json` (must parse as JSON; required fields present).
- Flag coordinated multi-plugin releases without documented toolset-level or plugin-prefixed Git tags when versions change.

## Portable source of truth (Bugbot / Loop)

- Flag re-adding portable Bugbot/Loop artifacts to domain plugins that now live in **`umbraculum-toolset-common`** (architecture docs, rules 56/57, `ci-watch-loop` skill, generic LOOP template) — post–v0.5.1 Magento dedup pattern.
- Flag duplicate always-on rules across common and domain plugins without intentional Strategy-C glob scoping documented in README.

## Rules (`.mdc`)

- Flag rules missing required frontmatter (`description`, appropriate `globs` or `alwaysApply`).
- Flag unintended `alwaysApply: true` on diagnostic or area-specific wiring that should be glob-scoped.
- Flag `final` class recommendations in PHP-facing copies where Magento interception applies (domain plugin context).

## Skills and agents

- Flag skills without bounded output contract or with more than five command templates in the runbook body.
- Flag agent definitions that duplicate an existing skill procedure instead of referencing the canonical skill path.

## Contributor discipline

- Flag commits in this repo without `Signed-off-by:` when DCO is required (`CONTRIBUTING.md`, rule `42-dco-signoff-gate.mdc`).
- Flag commit messages on branches with a Jira-style ticket token that omit the matching token in the subject.

## ci-parity appendix (when PR touches `packages/ci-parity/**` or root lockfile)

- Flag missing evidence of `npm run typecheck -w @umbraculum/ci-parity` and `npm test -w @umbraculum/ci-parity` for non-trivial package changes.
- Flag new or modified `package-lock.json` at nested paths — root lockfile only for this repo.
- Flag ci-parity workflow path filters bypassed without justification (see `.github/workflows/ci-parity-package.yml`).

## Out of scope for this review

Do not treat absence of runtime proof as a blocking bug:

- Full Cursor marketplace publish or install smoke on every machine
- Live Cursor dashboard Bugbot settings
- `~/.cursor/plugins/local/` mirror sync on developer workstations
- Plugin-only PRs with no GHA jobs (path-filtered workflows may report zero checks)

Flag only issues visible from the diff and static analysis.
