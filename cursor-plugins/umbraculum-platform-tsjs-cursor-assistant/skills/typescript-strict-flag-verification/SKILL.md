---
name: typescript-strict-flag-verification
description: Verify a TS workspace passes `tsc --noEmit` and carries all 6 strict flags. Use when editing tsconfig.json, adding TS files to a non-gated workspace, or after a strict-flag-related refactor.
---

# TypeScript strict-flag verification

Use this skill to confirm a workspace's TypeScript baseline is clean (the canonical one-off-container method) AND that the workspace's tsconfig carries all 6 candidate strict flags.

Some Umbraculum monorepos document a workspace-specific fallback in `docs/TYPING.md` because the canonical one-off container can fail to resolve local workspace packages even though the service's own container and CI are green. In that case, run the documented fallback and report the methodology mismatch instead of reporting a false type failure.

## Inputs required (do not assume)

- `<WORKSPACE_PATH>` (absolute path to the workspace, e.g. `/path/to/umbraculum-dev/services/api`)
- `<REPO_ROOT>` (absolute path to the monorepo root, e.g. `/path/to/umbraculum-dev`)
- `<NODE_IMAGE>` (the canonical Node image; default `node:20-slim` if `docs/TYPING.md` doesn't override)

## Output format (return exactly)

### Prerequisites

(brief — what the skill inferred from inputs, no commands run yet)

### Commands

(the bounded list of commands that were run, with their exit codes)

### Stop conditions

(any condition that aborted the run, or `(none triggered)` if all commands succeeded)

### Result

```
TYPECHECK <workspace>: OK | FAIL (N errors)
FLAGS <workspace>: 6/6 set | M/6 set (missing: flag1, flag2)
```

If `FAIL`: append up to 3 representative `<file>:<line> <error-code> <message>` lines (no more).

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling; no speculative paths.
- Bounded output: no full tsc output dump; no full tsconfig dump; no node_modules inspection.

## Prerequisites

- `<WORKSPACE_PATH>` exists and contains a `tsconfig.json` (or `package.json` with a `typecheck` script).
- `<REPO_ROOT>/node_modules/.bin/tsc` exists at the monorepo-root hoisted location, OR the project documents an alternative typecheck command in `docs/TYPING.md`.

## Commands

1. `docker run --rm -v "<REPO_ROOT>:/repo" -w /repo <NODE_IMAGE> bash -lc 'cd /repo/<workspace-relative-path> && /repo/node_modules/.bin/tsc -p tsconfig.json --noEmit 2>&1 | head -30'`
2. If command 1 fails only with unresolved local workspace package imports (for example `TS2307 Cannot find module '@umbraculum/...'`), and `docs/TYPING.md` documents an alternative command for that workspace, run the documented fallback. For the Umbraculum API workspace this is typically `docker compose exec -T api npm run typecheck` from repo root. Report this as `TYPECHECK <workspace>: OK (documented fallback; canonical one-off unresolved workspace packages)` if it passes.
3. Read `<WORKSPACE_PATH>/tsconfig.json` (file-reading tool).
4. (Optional, only if the tsconfig `extends` a parent) Read the parent tsconfig to resolve flag inheritance.

(Reserve any unused command slots for genuine follow-ups only; do not pad.)

## Stop conditions

- The file is binary or `<WORKSPACE_PATH>` does not exist.
- The canonical `<NODE_IMAGE>` is not pullable AND the project has no documented fallback.
- The typecheck output exceeds the head-30 cap repeatedly and is not the known unresolved-workspace-package class (signal that the failure is structural and needs a maintainer; do not paginate).
- Tsconfig inheritance chain is deeper than 2 levels (likely a misconfigured workspace; escalate).
