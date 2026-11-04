# Bugbot setup (umbraculum-toolset-common)

Operational runbook for enabling Bugbot on any adopting project. Rationale: [`BUGBOT-ARCHITECTURE.md`](BUGBOT-ARCHITECTURE.md).

## Inputs required (do not assume)

- `<REPO_ROOT>` — repository root (or application root if monorepo sub-root)
- `<GITHUB_REPO>` — repository where PRs are opened (for dashboard enablement)
- `<BASE_BRANCH>` — expected merge target (from `DEVELOPMENT-LOCAL.md`; examples: `staging`, `master`, `main`)
- `<BUGBOT_REVIEW_SKILL>` — domain plugin skill name (the consuming plugin's `*-bugbot-review`; examples: `typescript-bugbot-review`, `openplc-bugbot-review`, `plugin-pack-bugbot-review`)
- Whether the project has committed `.cursor/BUGBOT.md` at `<REPO_ROOT>/.cursor/BUGBOT.md`

## Prerequisites

- Cursor account with Bugbot access (usage-based billing may apply for cloud reviews)
- No Cursor Teams required
- Domain Cursor plugin installed (optional — local review + agent suggestions)
- `umbraculum-toolset-common` loaded (rules 56/57)

## One-time dashboard setup (mandatory for cloud PR review)

1. Open Cursor Dashboard → Bugbot → connect GitHub.
2. Enable Bugbot on `<GITHUB_REPO>`.
3. **Personal settings (required):**
   - **Run only when mentioned** — cloud Bugbot must NOT run automatically on any PR
   - **Autofix OFF**
   - Optional: **Run once per PR** (limits cost when you manually trigger)
4. Do **not** configure dashboard manual rules or learned rules — use git `.cursor/BUGBOT.md` instead.

## Bootstrap project rules (git)

1. Copy **domain** review template from the ecosystem plugin (or plugin-pack template from common):
   - TS/JS: `umbraculum-node-react-cursor-assistant/docs/templates/BUGBOT.md`
   - OpenPLC: `umbraculum-openplc-python-cursor-assistant/docs/templates/BUGBOT.md`
   - Plugin-pack / meta: `umbraculum-toolset-common/docs/templates/BUGBOT.plugin-pack.md` (e.g. umbraculum-toolset repo)
   - Other stacks (PHP, etc.): that stack's domain plugin `docs/templates/BUGBOT.md` (sibling repo; not shipped here)
   - Target: `<REPO_ROOT>/.cursor/BUGBOT.md`
2. Update `.gitignore` if needed to allow committed `.cursor/BUGBOT.md`.
3. Add optional pointers in project `DEVELOPMENT.md` and `AGENTS.md`.
4. Commit via normal PR workflow.

Without `.cursor/BUGBOT.md` in git, local agents skip Bugbot review (non-blocking).

## Daily workflow

| Step | Action |
|------|--------|
| 1 | Code with plugin rules as usual |
| 2 | Before push (optional): agent may suggest `<BUGBOT_REVIEW_SKILL>` or `/review-bugbot` — opt in |
| 3 | Push; open PR to **`<BASE_BRANCH>`** |
| 4 | CI runs (GHA or project equivalent) |
| 5 | For cloud review: comment **`bugbot run`** on the PR (manual only) |
| 6 | Triage findings; fix in foreground; run project verification gate |

## Local pre-PR review

Gates (domain skill enforces):

- `.cursor/BUGBOT.md` must exist → else `SKIPPED (no-bugbot-md)`
- Base branch must be **`<BASE_BRANCH>`** → else `SKIPPED (not-<base>-pr)`

Readonly. Never auto-fix findings.

## Output format (agent handoff)

- `Bugbot review: SKIPPED (reason: no-bugbot-md)`
- `Bugbot review: SKIPPED (reason: not-<base>-pr)`
- `Bugbot review: SKIPPED (reason: user-declined)`
- `Bugbot review: COMPLETE` + findings table or one-line "no issues"

## References

- [`BUGBOT-ARCHITECTURE.md`](BUGBOT-ARCHITECTURE.md)
- Rule: `rules/56-bugbot-checks-only.mdc`
