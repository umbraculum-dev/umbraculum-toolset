# Loop architecture (umbraculum-toolset-common)

Why we integrated Cursor `/loop` this way across umbraculum and sibling ecosystems. Operational steps live in [`LOOP-SETUP.md`](LOOP-SETUP.md).

## Problem

After pushing to a PR, developers wait on CI (GHA or equivalent). Polling manually is tedious. Cursor `/loop` repeats a prompt on a schedule in the **local session** — useful for read-only CI status checks without touching shared runners.

We must not encode **fix-until-green** loops: that conflicts with domain `15-subagent-delegation-guardrails.mdc` and can waste shared CI minutes via repeated pushes.

## Design goals

1. **Read-only by default** — loops poll GitHub API; they do not enqueue workflows
2. **Local session only** — Cursor built-in loop skill has `disabled-environments: cloud`
3. **Opt-in per project** — missing `.cursor/LOOP.md` must not block agents
4. **Git-first policy** — committed `.cursor/LOOP.md` for teams without the plugin
5. **Do not remove `AGENTS.md`** — LOOP mirrors invariants; AGENTS.md stays defense-in-depth
6. **Babysit is separate** — active fix/push loops only when the user explicitly invokes `/babysit`

## Three surfaces (do not conflate)

| Surface | Purpose | Writes to git / CI? |
|---------|---------|---------------------|
| **`/loop`** | Read-only monitoring (CI checks) | No |
| **`/babysit`** | Active PR merge prep (fix CI, push) | Yes — pushes re-trigger **your** PR checks |
| **Bugbot** | Static PR review | Cloud comment only when manual |

Use **`/loop` to wait**, **`/babysit` to fix** (user-invoked only). Do not merge them in one prompt.

## Layer stack

| Layer | Where | When active |
|-------|-------|-------------|
| Common rule + skill | Plugin install | Agent may suggest CI watch once |
| `AGENTS.md` loop section | Project git | All agents; plugin-absent defense-in-depth |
| `.cursor/LOOP.md` | Project git | Loop prompt policy when file exists |
| Cursor `/loop` | Local session | Developer or agent arms loop |
| GHA / CI | GitHub or Makefile | Unchanged merge gate |
| Project verification | `DEVELOPMENT.md` | Unchanged "done" gate |

## Why git `.cursor/LOOP.md`

Canonical policy text lives in [`docs/templates/LOOP.md`](templates/LOOP.md). Each adopting repo bootstraps **once** to `<REPO_ROOT>/.cursor/LOOP.md`.

Teams without the plugin still get loop safety rules when agents read committed `AGENTS.md` and `.cursor/LOOP.md`.

## GHA safety contract

**Allowed inside `/loop` prompts:**

- `gh pr checks`, `gh pr view --json statusCheckRollup`
- `gh run view` (read-only status)
- Bounded summary output — no full log dumps

**Forbidden inside `/loop` prompts** (unless user explicitly switched to `/babysit`):

- `git push`, `git commit`, `git merge`
- `gh workflow run`, `gh run rerun`, `gh pr merge`
- File edits, runtime install/migrate commands, config dumps
- Subagent delegation for iterative fixes
- Prompts like "fix until CI is green"

Read-only polling **does not** trigger GHA. Only **push** and **workflow_dispatch** enqueue runs.

## Defaults

| Setting | Value |
|---------|-------|
| Minimum interval | **5m** (not 30s — API noise, not CI harm) |
| Max duration | **2h** unless user specifies otherwise |
| Stop when | All checks terminal (success/failure/cancelled) or max duration |
| PR base | **`<BASE_BRANCH>`** from `DEVELOPMENT-LOCAL.md` (skill skips otherwise) |

## Graceful degradation

| Condition | Behavior |
|-----------|----------|
| No `.cursor/LOOP.md` | Skip loop suggestions; `Loop watch: SKIPPED (reason: no-loop-md)` |
| LOOP.md present, wrong base | Skill skips; `SKIPPED (reason: not-<base>-pr)` |
| No GHA / no open PR | `SKIPPED (reason: no-open-pr)` or `no-gha` when documented |
| User declines | Continue; non-blocking |
| Checks fail | Stop loop; report summary; fix in foreground or user runs `/babysit` |

Common rule: [`rules/57-loop-readonly-guardrails.mdc`](../rules/57-loop-readonly-guardrails.mdc). Skill: [`skills/ci-watch-loop/SKILL.md`](../skills/ci-watch-loop/SKILL.md).

## Relationship to `AGENTS.md`

- **Keep** existing `AGENTS.md` content
- **Add** optional Loop section in adopting repos (suggest-not-block; read-only)
- LOOP.md encodes loop-time policy; AGENTS.md encodes session-level reinforcement

## Teammate impact

| Action | Impact on others |
|--------|------------------|
| `/loop` + `gh pr checks` | None — read-only API on your PR |
| `/babysit` push | Re-runs CI on **your branch** only |
| Plugin install | Optional per developer |

## What loops cannot do

- Replace CI as merge gate
- Replace project verification in `DEVELOPMENT.md`
- Run in cloud agents (product limitation)
- Auto-fix failing checks without explicit `/babysit`

## References

- Cursor built-in loop skill (local session)
- Setup: [`LOOP-SETUP.md`](LOOP-SETUP.md)
- Policy template: [`templates/LOOP.md`](templates/LOOP.md)
- Bugbot (review, not monitor): [`BUGBOT-ARCHITECTURE.md`](BUGBOT-ARCHITECTURE.md)
