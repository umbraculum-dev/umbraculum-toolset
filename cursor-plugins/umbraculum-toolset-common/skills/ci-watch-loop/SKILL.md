---
name: ci-watch-loop
description: Opt-in read-only /loop CI watch when .cursor/LOOP.md exists; arms Cursor /loop once; never push or fix-until-green. Use when waiting on GHA checks after push to the project's base branch.
---

# CI watch loop (read-only, opt-in)

One-shot runbook that arms Cursor **`/loop`** for read-only `gh pr checks` polling. Polling is delegated to the built-in loop skill — this skill does not poll itself. See `umbraculum-toolset-common` `docs/LOOP-ARCHITECTURE.md`.

## Inputs required (do not assume)

- `<REPO_ROOT>` — repository root (or application root if monorepo sub-root)
- `<BASE_BRANCH>` — expected merge target from `DEVELOPMENT-LOCAL.md` (examples: `staging`, `master`, `main`)
- Optional: `<PR_NUMBER>` — if omitted, use current branch's open PR
- Optional: `<INTERVAL>` — default `5m` (minimum per policy)
- Optional: `<MAX_DURATION>` — default `2h`

Stop and ask if `<REPO_ROOT>` or `<BASE_BRANCH>` is unknown.

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

Final line (required):

- `Loop watch: SKIPPED (reason: no-loop-md)`
- `Loop watch: SKIPPED (reason: not-<base>-pr)` — substitute actual base token (e.g. `not-staging-pr`, `not-master-pr`)
- `Loop watch: SKIPPED (reason: user-declined)`
- `Loop watch: SKIPPED (reason: no-open-pr)`
- `Loop watch: SKIPPED (reason: no-gha)`
- `Loop watch: SKIPPED (reason: gh-not-installed)`
- `Loop watch: SKIPPED (reason: gh-not-authenticated)`
- `Loop watch: ARMED` — include interval, max duration, PR number, stop conditions
- `Loop watch: STOPPED` — include reason

## Bounds (hard)

- Max **5** one-shot commands (arming only; no polling in this skill)
- Polling delegated to Cursor built-in `/loop` skill
- Read-only — no file edits, no push, no workflow rerun
- Do not suggest `/babysit` when arming this loop

## Prerequisites

1. Confirm `<REPO_ROOT>` and `<BASE_BRANCH>`.
2. **Gate 1:** `<REPO_ROOT>/.cursor/LOOP.md` exists. If not → stop with `SKIPPED (reason: no-loop-md)`.
3. **Gate 2:** Open PR targets `<BASE_BRANCH>`:
   - `gh pr view --json baseRefName,number,state` (from `<REPO_ROOT>`)
   - If `gh` missing → `SKIPPED (reason: gh-not-installed)`
   - If `gh auth status` fails → `SKIPPED (reason: gh-not-authenticated)`
   - If no open PR → `SKIPPED (reason: no-open-pr)`
   - If `baseRefName` is not `<BASE_BRANCH>` → `SKIPPED (reason: not-<base>-pr)`.
4. User has opted in to arming a loop (do not auto-start).

## Commands (templates)

1. Verify adoption file:
   - `test -f <REPO_ROOT>/.cursor/LOOP.md && echo OK || echo MISSING`

2. Verify PR base (pick applicable):
   - `gh pr view --json baseRefName,number,state,statusCheckRollup`
   - Or with explicit number: `gh pr view <PR_NUMBER> --json baseRefName,number,state,statusCheckRollup`

3. Arm loop — invoke Cursor **`/loop`** with this prompt shape (substitute values):

```text
/loop <INTERVAL> Read-only CI watch for PR #<PR_NUMBER> (base <BASE_BRANCH>).
Each tick: run gh pr checks (or gh pr view --json statusCheckRollup). Summarize status changes only since last tick.
Forbidden: push, commit, gh run rerun, gh workflow run, file edits, subagent fix loops.
Stop when all checks terminal (success/failure/cancelled) or after <MAX_DURATION>.
Follow <REPO_ROOT>/.cursor/LOOP.md.
```

4. Confirm to user: interval, max duration, first tick timing, how to say "stop loop".

## Stop conditions

- `.cursor/LOOP.md` missing → `no-loop-md`
- Base branch not `<BASE_BRANCH>` → `not-<base>-pr`
- No open PR → `no-open-pr`
- No GHA configured on repo → `no-gha` (when documented in project)
- User declines → `user-declined`
- All checks terminal → agent stops loop; `STOPPED (reason: checks-terminal)`
- Max duration reached → `STOPPED (reason: max-duration)`

## After loop

- Loop is **not** the done gate — run project verification per `DEVELOPMENT.md`
- On failure: report summary; fix in foreground or user runs `/babysit` explicitly

## References

- `docs/LOOP-SETUP.md`
- `rules/57-loop-readonly-guardrails.mdc`
- Cursor built-in `loop` skill
