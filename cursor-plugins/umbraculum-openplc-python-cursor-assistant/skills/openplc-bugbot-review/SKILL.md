---
name: openplc-bugbot-review
description: Opt-in local Bugbot review before push for OpenPLC/Python projects with .cursor/BUGBOT.md; main-gated; readonly; never auto-fix. Use when preparing a main PR or when the user asks for pre-push review.
---

# OpenPLC Bugbot review (local, opt-in)

Readonly pre-push review wrapping Cursor `/review-bugbot` with rules from `.cursor/BUGBOT.md`. Portable policy: `umbraculum-toolset-common` `docs/BUGBOT-ARCHITECTURE.md`.

## Inputs required (do not assume)

- `<REPO_ROOT>` — OpenPLC + sidecar repository root
- `<BASE_BRANCH>` — expected merge target (default: `main`)
- Optional: diff scope — `branch changes` (default) or `uncommitted changes`

Stop and ask if `<REPO_ROOT>` is unknown.

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

Final line (required):

- `Bugbot review: SKIPPED (reason: no-bugbot-md)`
- `Bugbot review: SKIPPED (reason: not-main-pr)` — substitute actual base token when not `main`
- `Bugbot review: SKIPPED (reason: user-declined)`
- `Bugbot review: COMPLETE` + compact findings table (Severity | file:line | Finding) or one-line "no issues"

## Bounds (hard)

- Max **5** commands
- No loops or polling
- Readonly — no file edits, no auto-fix, no commits, no Modbus writes
- Do not post `bugbot run` on GitHub PRs

## Prerequisites

1. Confirm `<REPO_ROOT>`.
2. **Gate 1:** `<REPO_ROOT>/.cursor/BUGBOT.md` exists. If not → stop with `SKIPPED (reason: no-bugbot-md)`.
3. **Gate 2:** Confirm PR base or merge target is `<BASE_BRANCH>` (default `main`):
   - `git -C <REPO_ROOT> rev-parse --abbrev-ref HEAD` and compare merge-base to `origin/<BASE_BRANCH>`, or
   - `gh pr view --json baseRefName` when a PR exists
   - If not targeting `<BASE_BRANCH>` → stop with `SKIPPED (reason: not-<base>-pr)` (e.g. `not-main-pr`).

## Commands (templates)

1. Verify adoption file:
   - `test -f <REPO_ROOT>/.cursor/BUGBOT.md && echo OK || echo MISSING`

2. Verify base branch (pick one applicable):
   - `git -C <REPO_ROOT> merge-base --is-ancestor HEAD origin/<BASE_BRANCH> 2>/dev/null; git -C <REPO_ROOT> log -1 --oneline`
   - Or: `gh pr view --json baseRefName -q .baseRefName`

3. Invoke review via `/review-bugbot` (preferred) or `bugbot` subagent with this prompt shape:

```text
Full Repository Path: <REPO_ROOT>
Diff: branch changes
Custom Instructions: Apply review rules from <REPO_ROOT>/.cursor/BUGBOT.md. Checks only; do not suggest Autofix. OpenPLC + Python sidecar project.
```

4. Summarize findings in a compact table sorted by severity. Do not fix unless user explicitly asks in a separate step.

## Stop conditions

- `.cursor/BUGBOT.md` missing → `no-bugbot-md`
- Base branch not `<BASE_BRANCH>` → `not-<base>-pr`
- User declines review → `user-declined`
- Subagent failure after one retry → report blocker; do not block unrelated work

## After review

- Bugbot is **not** the done gate — run project verification per `DEVELOPMENT.md` (`make test-tools`, `make mailbox-artifact`, sidecar pytest as applicable)
- For cloud review on an open PR: **suggest** developer comment `bugbot run` (manual only; dashboard must have "run only when mentioned")

## References

- `umbraculum-toolset-common` `docs/BUGBOT-SETUP.md`
- `umbraculum-toolset-common` `rules/56-bugbot-checks-only.mdc`
- Cursor built-in `review-bugbot` skill
