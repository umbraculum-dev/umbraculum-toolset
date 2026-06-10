---
name: tamagui-cli-check
description: Run npx @tamagui/cli check via scripts/check-tamagui-cli.sh after Tamagui version/hoist changes or duplicate-instance runtime errors. Use proactively when editing tamagui/@tamagui/* pins, root overrides, ui/recipes-ui/web/native Tamagui surface, or debugging "Can't find Tamagui configuration". See rule 79-tamagui-cli-monorepo-gate.mdc.
---

# Skill: Tamagui CLI check — duplicate-instance gate (umbraculum-dev)

## Why this skill exists

Tamagui fails at runtime when webpack/Metro resolve **more than one physical copy** of `tamagui` / `@tamagui/core` — even at the **same version**. Symptom: `Can't find Tamagui configuration` / `no parent theme context` on `SizableText` under `TamaguiProvider`.

`npx @tamagui/cli check` is Tamagui’s supported detector. In this monorepo, nested `node_modules` under `file:` workspace links (`@umbraculum/ui`, `@umbraculum/brewery-recipes-ui`) are the usual cause after root or `apps/web` installs.

## Inputs required (do not assume)

- `<REPO_ROOT>` — absolute path (e.g. `/path/to/umbraculum-dev`).
- Whether the change set matches rule **`79-tamagui-cli-monorepo-gate.mdc`** triggers (version pins, overrides, lockfiles, Tamagui runtime error, web/ui/native Tamagui edits).

## Output format (return exactly)

### Prerequisites

(confirmed repo root, change set warrants gate, Docker available)

### Commands

(bounded list with exit codes)

### Stop conditions

(`(none triggered)` or specific halt reason)

### Result

```
TAMAGUI-CLI-CHECK <commit-or-WIP>: check=<OK|FAIL>
```

If FAIL, append up to 5 lines from `@tamagui/cli check` (duplicate paths or version skew).

## Bounds (hard)

- Max **2** commands (full gate + optional quick re-check).
- Use **`docker run node:20-slim`** with repo bind-mount — not host npm.
- No loops; no “push and see if login works” without running the script first.
- Read-only w.r.t. tracked tree (does not commit).

## Prerequisites

- Change set warrants gate (see rule 79) **or** operator reported Tamagui configuration runtime error.
- Docker available.

## Commands

### 1. Full gate (preferred — matches `scripts/check-tamagui-cli.sh`)

```bash
cd <REPO_ROOT> && docker run --rm -v "$PWD:/repo" -w /repo node:20-slim \
  bash -lc "./scripts/check-tamagui-cli.sh"
```

Expect final line: `Tamagui dependencies look good ✅`

### 2. After fixing pins only — quick re-check in running web container (optional)

Use only when web compose is already up and you removed nested dirs on the **host** (`packages/platform/ui/node_modules`, `recipes-ui/node_modules`) and recreated web:

```bash
cd <REPO_ROOT> && docker compose exec web bash -lc \
  "rm -rf node_modules/@umbraculum/ui/node_modules node_modules/@umbraculum/brewery-recipes-ui/node_modules 2>/dev/null; npm dedupe --legacy-peer-deps && npx @tamagui/cli check"
```

If `Read-only file system` on `rm`, run command **1** instead (fresh `npm ci` in ephemeral container).

## Stop conditions

- Proposed Tamagui versions differ across the five manifests → halt; align pins + root `overrides` first (`docs/TAMAGUI.md`).
- CLI check still FAIL after script → do not declare web/native UI done; inspect duplicate paths printed by the CLI.
- Doc-only change with no Tamagui surface → skip (no command required).

## Do-not-regress checklist

- [ ] All five manifests pin the **same** `tamagui` / `@tamagui/*` version.
- [ ] Root `overrides` include `tamagui`, `@tamagui/core`, `@tamagui/config`, animation packages when bumped.
- [ ] `packages/platform/ui/node_modules` absent on host after root install.
- [ ] `docker compose` web startup strips nested `@umbraculum/*/node_modules` after `npm install` (see `docker-compose.yml`).

## Local-subagent-future readiness

Input-driven (`<REPO_ROOT>`), output-constrained (Result line), bounded (≤2 commands).
