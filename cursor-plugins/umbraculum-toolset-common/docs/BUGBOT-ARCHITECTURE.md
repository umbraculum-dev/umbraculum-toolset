# Bugbot architecture (umbraculum-toolset-common)

Why we integrated Cursor Bugbot this way across umbraculum and sibling ecosystems. Operational steps live in [`BUGBOT-SETUP.md`](BUGBOT-SETUP.md).

## Problem

Generic PR review misses high-cost traps that domain plugins and `AGENTS.md` already encode at coding time. Cloud Bugbot on GitHub **does not read** plugin install paths. It reads **git-committed** `.cursor/BUGBOT.md` and optional Cursor dashboard rules.

**Language-specific review rows** live in each domain plugin's `docs/templates/BUGBOT.md` (TS/JS monorepo, OpenPLC/Python, PHP domain plugins outside this repo, etc.). **Plugin-pack / meta repos** (rules, skills, agents, manifests) use `docs/templates/BUGBOT.plugin-pack.md` in **toolset-common** — not a domain plugin.

## Design goals

1. **Checks only** — no Autofix, no Cloud Agent auto-commits
2. **No Cursor Teams** — no team dashboard rules; git-first project rules
3. **Minimal dashboard** — one-time GitHub connect + mandatory personal settings only
4. **Full cloud control** — cloud Bugbot never runs on a PR unless manually triggered
5. **Opt-in per project** — missing `.cursor/BUGBOT.md` must not block agents or verification
6. **Do not remove `AGENTS.md`** — BUGBOT mirrors invariants; AGENTS.md stays as defense-in-depth

## Layer stack

| Layer | Where | When active |
|-------|-------|-------------|
| Common rules / domain skills | Plugin install | Local Cursor coding |
| `AGENTS.md` | Project git | Always (all agents) |
| `.cursor/BUGBOT.md` | Project git | Cloud PR review + local Custom Instructions |
| Local `/review-bugbot` | Cursor session | Developer opt-in; agent may suggest |
| Cloud Bugbot | GitHub PR | Only after `bugbot run` / `cursor review` comment |
| Project verification gate | `DEVELOPMENT.md` | Unchanged "done" gate |

## Why git `.cursor/BUGBOT.md` (not dashboard repository rules)

| Mechanism | Storage | We use? |
|-----------|---------|---------|
| **Project rules** | `.cursor/BUGBOT.md` in git | **Yes** — versioned, PR-reviewable |
| **Manual rules** | Cursor dashboard per repo | **No** — extra maintenance layer |
| **Learned rules** | Cursor cloud from PR history | **No** — opaque, not in git |

Canonical **review-rule text** lives in the **domain plugin** `docs/templates/BUGBOT.md` (or **toolset-common** `docs/templates/BUGBOT.plugin-pack.md` for plugin-pack repos). Bootstrap once to `<REPO_ROOT>/.cursor/BUGBOT.md`.

## Cloud control — manual only

**Required personal setting:** Run only when mentioned.

- Cloud Bugbot does **not** run on PR open, push, or sync
- Review runs only when someone comments **`bugbot run`** or **`cursor review`** on that PR
- **Autofix OFF** — findings are advisory; humans fix in foreground

Individual mode: Bugbot applies to **your** GitHub connection. Teammates without Bugbot enabled are unaffected.

## Two-step opt-in workflow

| Step | When | Trigger | Blocking? |
|------|------|---------|-----------|
| Pre-PR local review | Before `git push`, work targeting `<BASE_BRANCH>` | Agent suggests; developer runs `<BUGBOT_REVIEW_SKILL>` or `/review-bugbot` | No |
| Cloud review | After PR to `<BASE_BRANCH>` is open | Developer comments `bugbot run` on PR | No |

Local review can dedupe cloud review (same diff patch ID). GHA remains the merge gate when configured.

## Base branch alignment

| Surface | Config |
|---------|--------|
| Local `<BUGBOT_REVIEW_SKILL>` | Gates on `<BASE_BRANCH>` from `DEVELOPMENT-LOCAL.md` (examples: `staging`, `master`, `main`) |
| Cloud Bugbot | Manual only — comment `bugbot run` when wanted |
| GHA | Per-repo workflow config |

## Graceful degradation

| Condition | Behavior |
|-----------|----------|
| No `.cursor/BUGBOT.md` | Skip Bugbot review; do not block tasks; `Bugbot review: SKIPPED (reason: no-bugbot-md)` |
| BUGBOT.md present, wrong base | Local skill skips; `SKIPPED (reason: not-<base>-pr)` |
| Findings reported | Triage in foreground; not a done gate; not auto-fixed |

Common rule: [`rules/56-bugbot-checks-only.mdc`](../rules/56-bugbot-checks-only.mdc). Domain skills: the consuming plugin's `*-bugbot-review` skill (e.g. `typescript-bugbot-review`, `openplc-bugbot-review`, `plugin-pack-bugbot-review`).

## Relationship to `AGENTS.md`

- **Keep** existing `AGENTS.md` content
- **Add** optional Bugbot section in adopting repos (suggest-not-block policy)
- BUGBOT.md encodes review-time checks; AGENTS.md encodes coding-time reinforcement

## What Bugbot cannot verify

Static diff review only. Bugbot does not replace runtime verification documented in each project's `DEVELOPMENT.md` (curl, tests, ci-parity, Makefile targets, etc.).

## Teammate impact

- Plugin install: optional per developer
- Cloud Bugbot: Individual + manual trigger — no automatic reviews on teammates' PRs
- `.cursor/BUGBOT.md` in git: applies when cloud review is manually triggered on that PR

## References

- Cursor docs: https://cursor.com/docs/bugbot
- Setup: [`BUGBOT-SETUP.md`](BUGBOT-SETUP.md)
- Rule: [`rules/56-bugbot-checks-only.mdc`](../rules/56-bugbot-checks-only.mdc)
