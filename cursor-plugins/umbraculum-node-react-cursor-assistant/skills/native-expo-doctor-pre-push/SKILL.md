---
name: native-expo-doctor-pre-push
description: Reproduce the GHA native-deps workflow (root npm ci + check-native-expo-doctor.sh + brewery typecheck) before pushing changes to apps/native, native-shell peers, root overrides, or native hoist lockfiles. Use proactively when editing those paths — ci-parity typecheck alone does NOT run expo-doctor. See rule 78-native-expo-doctor-monorepo-gate.mdc.
---

# Skill: Native expo-doctor — pre-push parity (umbraculum-dev)

## Why this skill exists

`npx @umbraculum/ci-parity` runs **`typecheck`** but does **not** execute [`.github/workflows/native-deps.yml`](../../umbraculum-dev/.github/workflows/native-deps.yml). That workflow runs root **`npm ci`**, [`scripts/check-native-expo-doctor.sh`](../../umbraculum-dev/scripts/check-native-expo-doctor.sh) (stale-tree cleanup + `expo install --check` + `expo-doctor` 18/18), then **`npm run typecheck -w @umbraculum/native-brewery`**.

Local gaps this skill closes:

| Missed locally | CI symptom |
|---|---|
| Phantom `expo@56` at root from loose peers | Doctor duplicate dependencies |
| `apps/web` on React `19.2.x` while brewery on `19.1.0` | Doctor duplicate `react` (Path A forbids this) |
| Stale `apps/native/node_modules` | Third `expo@54` copy in doctor output |
| `app.config.js` not spreading `app.json` | Doctor Expo config check fail |

**T2 native gate:** run **ci-parity** **and** this skill when the change set touches native hoist paths. See [`docs/VERIFICATION-TIERS.md`](../../umbraculum-dev/docs/VERIFICATION-TIERS.md).

## Inputs required (do not assume)

- `<REPO_ROOT>` — absolute path (e.g. `/path/to/umbraculum-dev`).
- Whether the diff touches: `apps/native/**`, `packages/platform/native-shell/**`, root `package.json` / `package-lock.json` `overrides`, or `scripts/check-native-expo-doctor.sh`.

## Output format (return exactly)

### Prerequisites

(confirmed repo root, change set warrants gate, committed state)

### Commands

(bounded list with exit codes)

### Stop conditions

(`(none triggered)` or specific halt reason)

### Result

```
NATIVE-EXPO-DOCTOR-PRE-PUSH <commit-sha>: doctor=<OK|FAIL> expo_install_check=<OK|FAIL> typecheck=<OK|FAIL|SKIPPED>
```

If FAIL, append up to 3 lines from `expo-doctor` or `expo install --check` output.

## Bounds (hard)

- Max **3** commands.
- Use **`docker run node:20-slim`** with repo bind-mount (EAS-like) — not host npm, not brewery-only install.
- No loops; no "push and see what CI says".
- Read-only w.r.t. tracked tree (does not commit).

## Prerequisites

- Change set touches native hoist surface (see Inputs).
- Docker available.
- Working tree clean for push proof (same commit CI will check out).

## Commands

### 1. Full native-deps parity (preferred — matches GHA)

```bash
cd <REPO_ROOT> && docker run --rm -v "$PWD:/repo" -w /repo node:20-slim \
  bash -lc "npm ci --no-audit --no-fund && ./scripts/check-native-expo-doctor.sh && npm run typecheck -w @umbraculum/native-brewery"
```

### 2. Static analysis first (when also editing shared TS outside native)

If `.umbraculum/ci-parity.json` exists and diff touches `packages/**`:

```bash
cd <REPO_ROOT> && ./scripts/ci-parity-check.sh --archive run --jobs typecheck
```

Skip when native-only dep bump with no TS edits.

### 3. Optional — inspect trigger resolution

```bash
cd <REPO_ROOT> && python3 scripts/lib/verify-slice.py --repo-root . resolve-gha-triggers --base origin/master
```

Expect `native-deps` in `matchedWorkflows` and `expo-doctor` in `nativeSteps` when paths match.

## Stop conditions

- Attempting to bump `apps/web` `react` past root `overrides` (`19.1.0`) without Path B plan → halt; read `docs/design/expo-doctor-monorepo-assessment.md` §5.
- Proposed `native-shell` peer `expo: ">=54"` → reject; use `~54.0.35`.
- Doctor fails on duplicates after remediation → run cleanup script path manually; do not delete overrides.

## Do-not-regress checklist (before merge)

- [ ] Root `overrides` still pin `expo`, `react`, `react-dom`, `react-native`, `react-native-svg`, `expo-font`.
- [ ] `native-shell` has **no** `expo-*` in `devDependencies`.
- [ ] `app.config.js` uses `({ config }) =>` spread pattern.
- [ ] `metro.config.js` resolves `react` from brewery workspace.
- [ ] `apps/native/node_modules` absent after script run.

## Local-subagent-future readiness

Input-driven (`<REPO_ROOT>`), output-constrained (Result line), bounded (≤3 commands).
