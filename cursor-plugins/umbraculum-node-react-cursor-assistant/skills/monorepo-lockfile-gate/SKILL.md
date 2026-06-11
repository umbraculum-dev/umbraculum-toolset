---
name: monorepo-lockfile-gate
description: Monorepo lockfile gate — composer install (npm ci / lock:install) vs update (lock:update); always commit tracked package-lock.json when changed; full revert via lock:revert; forbidden services/api/package-lock.json; npm run check:lockfiles before commit. Use when lockfiles or workspace package.json deps change, or npm ci fails on sync.
---

# Skill: Monorepo lockfile gate (umbraculum-dev)

## Why this skill exists

Lockfiles are **`composer.lock` equivalents** — reproducible installs. `package.json` is constraints only.

- **`npm ci`** / **`npm run lock:install`** = **composer install** (from lock; does not rewrite lock).
- **`npm install`** / **`npm run lock:update:*`** = **composer update** (rewrites lock).

If any **committed** `package-lock.json` changed locally, dependencies changed — **commit it with the matching `package.json`** after testing.

**`git restore` on a lock is NOT a full revert.** Run **`npm run lock:revert`** to restore lock from git **and** reinstall `node_modules`.

**`services/api/package-lock.json`** is forbidden (gitignored ephemeral) — delete, never commit. API deps live in **root** `package-lock.json`.

**Operator is an analyst:** agents run this skill; do not instruct the operator to "remember lockfile policy."

## Inputs required

- `<REPO_ROOT>` — absolute path (e.g. `/path/to/umbraculum-dev`).
- Whether triggers from rule **`80-monorepo-lockfile-agent-gate.mdc`** apply.

## Output format

### Prerequisites

(confirmed repo root, trigger applies, Docker available)

### Commands

(bounded list with exit codes)

### Stop conditions

(`(none triggered)` or halt reason)

### Result

```
MONOREPO-LOCKFILE-GATE <commit-or-WIP>: forbidden=OK|FAIL sync=OK|FAIL install-proof=OK|FAIL|SKIPPED
```

## Bounds

- Max **6** commands for a full update+commit path.
- Lock regen / `npm ci` proof: **`node:20-slim`** or **`docker compose exec web`** — not host npm alone for commits.
- Deleting `services/api/package-lock.json` on host is allowed.

## Committed lockfiles

| Path | Update command |
|------|------------------|
| `package-lock.json` | `npm run lock:update:root` |
| `apps/web/package-lock.json` | `npm run lock:update:web` |
| `apps/web/e2e/package-lock.json` | manual in that directory (rare) |
| `packages/platform/test-mcp/package-lock.json` | manual (rare) |
| `docs-site/vendor/brochure/package-lock.json` | manual (rare) |

Tamagui bumps: update **root** and **web** locks together (`docs/TAMAGUI.md`).

## Procedure

### 0. Remove forbidden lockfile (when present)

```bash
cd <REPO_ROOT> && rm -f services/api/package-lock.json && ./scripts/check-monorepo-lockfiles.sh
```

### 1. Install from locks (composer install — day-to-day, after revert)

```bash
cd <REPO_ROOT> && npm run lock:install
```

Or scoped: `npm run lock:install:root` / `npm run lock:install:web`.

### 2. Update locks (composer update — after editing package.json deps)

Root:

```bash
cd <REPO_ROOT> && npm run lock:update:root
```

Web isolated lock:

```bash
cd <REPO_ROOT> && npm run lock:update:web
```

Then test the surfaces that consume those deps.

### 3. Full revert after accidental lock rewrite

```bash
cd <REPO_ROOT> && npm run lock:revert
```

This restores committed locks from git **and** runs `lock:install` — not `git restore` alone.

### 4. Before commit (when any tracked lockfile is in the change set)

```bash
cd <REPO_ROOT> && npm run check:lockfiles
```

Expect: monorepo + root sync + web sync all OK.

Commit **`package.json` + `package-lock.json` together**.

### 5. Before push

```bash
cd <REPO_ROOT> && git status --porcelain   # clean tree
cd <REPO_ROOT> && npm run verify:pre-push
```

## Stop conditions

- `check-monorepo-lockfiles: FAIL` with `services/api/package-lock.json` → remove; never stage.
- Any sync check FAIL → run procedure **2** for that island, re-run **4**; do not commit until OK.
- `npm ci` / `lock:install` fails → do not push; fix lock in container.
- Doc-only, no lockfile surface → skip (Result: `SKIPPED`).

## Do-not-regress checklist

- [ ] `services/api/.npmrc` has `package-lock=false`.
- [ ] `docker-compose.yml` api command includes `rm -f package-lock.json` after install.
- [ ] `docker-compose.yml` web command uses **`npm ci`** (not `npm install`) on boot.
- [ ] No `services/api/package-lock.json` in `git diff --cached`.
- [ ] Tracked lockfile changes are **committed**, not left dirty or `git restore` without reinstall.

## Local-subagent-future readiness

Input-driven (`<REPO_ROOT>`), output-constrained (Result line), bounded commands.
