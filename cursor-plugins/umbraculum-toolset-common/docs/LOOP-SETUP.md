# Loop setup (umbraculum-toolset-common)

Operational runbook for read-only `/loop` CI monitoring. Rationale: [`LOOP-ARCHITECTURE.md`](LOOP-ARCHITECTURE.md).

## Inputs required (do not assume)

- `<REPO_ROOT>` — repository root
- `<BASE_BRANCH>` — from `DEVELOPMENT-LOCAL.md`
- Whether `.cursor/LOOP.md` exists at `<REPO_ROOT>/.cursor/LOOP.md`
- Local `gh` CLI authenticated (when using GitHub PR checks)

## Prerequisites

- Cursor with `/loop` support (local session only — not cloud)
- `umbraculum-toolset-common` loaded (rule 57 + `ci-watch-loop` skill)
- No dashboard setup (unlike Bugbot)

## Bootstrap project rules (git)

1. Copy from common: `docs/templates/LOOP.md` → `<REPO_ROOT>/.cursor/LOOP.md`
2. Set `<BASE_BRANCH>` in the Defaults section to your project value.
3. Update `.gitignore` if needed:

```gitignore
.cursor/*
!.cursor/BUGBOT.md
!.cursor/LOOP.md
```

4. Add optional pointers in `AGENTS.md`.

## Arming a CI watch loop

**Via skill:** invoke **`ci-watch-loop`** with `<REPO_ROOT>` and PR context.

**Via `/loop` directly (example):**

```text
/loop 5m Read-only: run gh pr checks for the current branch PR. Summarize status changes only. Do not push, commit, rerun workflows, or edit files. Stop when all checks are terminal or after 2 hours. Follow .cursor/LOOP.md.
```

## Stopping a loop

User says **"stop loop"**. Agent kills the tracked loop PID per Cursor built-in loop skill.

## Output format (agent handoff)

- `Loop watch: SKIPPED (reason: no-loop-md|not-<base>-pr|no-open-pr|no-gha|gh-not-installed|gh-not-authenticated|user-declined)`
- `Loop watch: ARMED` + interval, max duration, stop conditions
- `Loop watch: STOPPED` + reason

## References

- [`LOOP-ARCHITECTURE.md`](LOOP-ARCHITECTURE.md)
- [`templates/LOOP.md`](templates/LOOP.md)
- Rule: `rules/57-loop-readonly-guardrails.mdc`
- Skill: `skills/ci-watch-loop/SKILL.md`
