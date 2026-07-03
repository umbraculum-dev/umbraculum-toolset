# Loop policy — read-only CI watch

Feature work merges via PRs to **`<BASE_BRANCH>`**. Use **`/loop`** for read-only monitoring while CI runs. Use **`/babysit`** only when you explicitly want active fix-and-push merge prep.

**Policy:** Read-only inside loops. No pushes, reruns, or file edits unless you switched to `/babysit`.

---

## Allowed commands in `/loop` prompts

- `gh pr checks` — check rollup for current PR
- `gh pr view --json baseRefName,number,statusCheckRollup,state`
- `gh run view <run-id> --json status,conclusion,name` — read-only run status
- Brief human-readable summary of changes since last tick

## Forbidden in `/loop` prompts

- `git push`, `git commit`, `git merge`, `git rebase`
- `gh workflow run`, `gh run rerun`, `gh pr merge`, `gh pr review --approve`
- File edits, runtime install/migrate commands, config dumps
- Subagent or Task-tool delegation for iterative fixes
- Prompts containing "fix until green", "keep trying until CI passes", or equivalent

## Defaults

| Setting | Value |
|---------|-------|
| Interval | **≥ 5m** |
| Max duration | **2h** |
| PR base | **`<BASE_BRANCH>`** (set per project in `DEVELOPMENT-LOCAL.md`) |
| Stop when | All checks terminal (success, failure, cancelled) or max duration reached |

## Escalation when checks fail

1. **Stop the loop** — do not loop-fix in the same session
2. Report failing check names and one-line evidence each
3. Fix in the **foreground**, or user explicitly runs **`/babysit`**
4. Do not suggest `/babysit` proactively when suggesting `/loop`

## GHA safety

Polling `gh pr checks` does **not** enqueue GitHub Actions. Only **push** and **workflow_dispatch** trigger new runs. Read-only loops are safe for shared CI used by the team.

---

## Appendix: local log tail (optional, no PR)

For long local repro while waiting on a process — **not** for CI watch. Replace placeholders with values from `DEVELOPMENT-LOCAL.md` (container name, log paths, Makefile targets).

```text
/loop 5m Read-only: tail the last 20 lines of the project's primary error log.
Summarize new ERROR lines only. Do not restart services or edit files.
Stop after 1h or when user says stop.
```

---

## References

- Plugin: `umbraculum-toolset-common` `docs/LOOP-ARCHITECTURE.md`
- Skill: `ci-watch-loop`
- Bugbot (review, separate): `.cursor/BUGBOT.md`
