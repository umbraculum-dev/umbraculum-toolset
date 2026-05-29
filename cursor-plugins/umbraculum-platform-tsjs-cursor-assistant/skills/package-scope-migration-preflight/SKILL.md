---
name: package-scope-migration-preflight
description: Generate a per-slot file inventory + classification + hard-stop flags BEFORE editing any file in a `@brewery/<name>` → `@umbraculum/<name|brewery-<name>>` package-scope rename. Use proactively when starting a new slot in sub-plan #9 (canonical handoff doc lives at `docs/design/brewery-scope-migration-per-package-handoff.md`).
---

# Package-scope migration preflight

Use this skill at the **start of a slot** in the `@brewery/*` → `@umbraculum/*` package-scope migration (sub-plan #9). It produces a bounded inventory + classification-gate + hard-stop checklist that the operator (frontier agent or human) then walks through file-by-file. It does NOT perform the rename; it only produces the per-slot worksheet.

## Inputs required (do not assume)

- `<PACKAGE_NAME>` (the leaf name without scope; e.g. `media`, `navigation`, `core`)
- `<REPO_ROOT>` (absolute path to the monorepo root; e.g. `/home/rf/dkprojects/rfapps/umbraculum-dev`)
- `<HANDOFF_DOC_PATH>` (absolute path to the slot checklist; canonical: `<REPO_ROOT>/docs/design/brewery-scope-migration-per-package-handoff.md`)

## Output format (return exactly)

### Prerequisites

(what was inferred from inputs — package classification per handoff §1.1, target name, expected slot number)

### Commands

(the bounded list of commands run, with exit codes)

### Stop conditions

(`(none triggered)` if all gates passed; otherwise the specific gate that triggered, e.g. `core-trap (target must be @umbraculum/brewery-core not @umbraculum/core)`)

### Result

```
PACKAGE @brewery/<name>: classification=<platform|brewery-vertical|app-workspace> target=@umbraculum/<...>
INVENTORY: <N files> across <M categories>
HARD-STOPS: <K> (<list>) | (none)
CORE-TRAP: <triggered|not applicable>
```

If `HARD-STOPS > 0`: append up to 3 lines, one per stop, in the form `<category>: <one-line-finding>`.

If `INVENTORY` exceeds 50 files: append a note `inventory-truncation: showing first 50; full list in handoff doc slot <N>` (the operator should defer to the handoff doc rather than re-inventorying live).

## Bounds (hard)

- Max 7 commands total (grew from 5 to 7 during slot 6 — Commands 6 + 7 cover newly-discovered HARD STOP classes).
- No loops; no polling; no speculative paths.
- Bounded output: no full grep dump, no full file enumeration, no full README/doc dumps. Cap inventory at 50 files.
- This skill is **read-only**. It must not edit any file.

## Prerequisites

- `<REPO_ROOT>/packages/<PACKAGE_NAME>/package.json` exists (the source package).
- `<HANDOFF_DOC_PATH>` exists (the slot checklist; if absent, fall back to a pure grep-based inventory and flag in `Stop conditions`).
- `grep` is on PATH.

## Commands

1. Canonical consumer grep (per plan doc §2.1 methodology):
   ```bash
   grep -rlE "@brewery/<PACKAGE_NAME>([^a-zA-Z0-9_-]|$)" \
     --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.mjs' \
     --include='*.json' --include='*.md' --include='*.py' --include='*.yml' --include='*.yaml' \
     --include='*.css' --include='*.prisma' \
     --exclude-dir=node_modules --exclude-dir=dist --exclude='package-lock.json' \
     <REPO_ROOT> | head -50
   ```
2. Inspect `<REPO_ROOT>/packages/<PACKAGE_NAME>/package.json` for `bin:` field (file-read tool; cap to first 40 lines). If `bin:` exists with `"brewery-<name>": "..."`, flag `HARD-STOP: bin-rename-required`.
3. Check `<REPO_ROOT>/apps/web/next.config.js` for `transpilePackages` entries (grep `@brewery/<PACKAGE_NAME>`). If present, flag `HARD-STOP: next-transpile-packages` (silent web build-miss if missed).
4. Check `<REPO_ROOT>/apps/native/metro.config.js` for `extraNodeModules` or alias entries (grep `@brewery/<PACKAGE_NAME>`). If present, flag `HARD-STOP: metro-alias`.
5. Check `<REPO_ROOT>/package.json` `build:packages` script for the workspace name (grep `@brewery/<PACKAGE_NAME>`). If present, flag `HARD-STOP: root-build-packages-script` (rebuild step 5 will fail with "workspace not found" if missed).
6. Check `<REPO_ROOT>/package.json` `test:packages` script for the workspace name (grep `@brewery/<PACKAGE_NAME>`). If present, flag `HARD-STOP: root-test-packages-script` (root-level package-test execution + CI `api.yml` shared-package-unit-tests job will fail with "workspace not found" if missed). **Added during slot 6** when `@brewery/core` was found in `test:packages` but Command 5 only checks `build:packages`.
7. Scan `<REPO_ROOT>/.github/workflows/*.yml` for workflow **step display names** (not path globs) that contain `@brewery/<PACKAGE_NAME>` — grep `^      - name:.*@brewery/<PACKAGE_NAME>` or just `name:.*@brewery/<PACKAGE_NAME>`. If present, flag `HARD-STOP: workflow-step-display-name`. These are cosmetic (CI still passes because the actual command resolves through the workspaces map), but reviewers reading the GitHub Actions UI see stale names. **Added during slot 6** when `api.yml` line 43 `name: Run @brewery/contracts + @brewery/core unit tests` was found. Note: path globs in `on.push.paths` / `on.pull_request.paths` use filesystem paths (`packages/<name>/**`) and do NOT need updating — only the human-readable step names do.

(Do not pad. If `<PACKAGE_NAME>` has zero consumers — leaf with no inbound deps — steps 3–7 may report no hits and that is OK.)

## Stop conditions

- **`<PACKAGE_NAME>` is `core`** — TRIGGER `core-trap`. The target name MUST be `@umbraculum/brewery-core` (NOT `@umbraculum/core`); the bare `@umbraculum/core` is reserved for the future framework-tier package. Halt and confirm target with operator before proceeding.
- The grep returns >100 files — likely a substring collision (e.g. `@brewery/contracts-internal` matched by `@brewery/contracts`); the regex tail `([^a-zA-Z0-9_-]|$)` is intended to prevent this, but signal anyway.
- `<HANDOFF_DOC_PATH>` is absent — fall back to grep-only inventory; flag in Stop conditions so operator knows the slot-specific hard-stops from the handoff doc were not consulted.
- The package's `package.json` has a `"workspaces"` field (i.e. it is itself a nested-workspace root) — out of scope; this skill targets leaf workspace packages.

## Operator follow-up (after this skill runs)

1. Cross-check the inventory + hard-stops against the handoff doc's slot entry.
2. Apply plan doc §4 steps 1–7 (rename → classification gate → find-replace → lockfile regen → dist rebuild → typecheck/test/smoke → commit).
3. **In step 4b: only reinstall web — do NOT reinstall api here.** Step 5 (the build script) will wipe `services/api/node_modules` devDeps anyway via its `npm ci`; any api install in step 4b is wasted.
   ```bash
   docker compose exec web sh -c 'cd /app && npm install --include=dev --no-audit --no-fund'
   ```
4. **In step 5: use the STOP-build-install-START sequence** for api (surfaced during slot 4 — supersedes the slot-3 stop-install-start preventive, which only worked as a recovery, not as a preventive):
   ```bash
   docker compose stop api                                                      # tsx watch out of harm's way
   bash scripts/build-packages-in-docker.sh                                     # build's npm ci can wipe api node_modules freely
   docker run --rm -v "$PWD/services/api:/app" -w /app node:20-slim \
     bash -lc 'npm install --include=dev --no-audit --no-fund'                  # restore devDeps post-build
   docker compose start api                                                     # startup npm install is a no-op now
   curl -sS http://localhost:18080/api/health                                   # expect {"ok":true}
   ```
   **Why this sequence:** the build script (`scripts/build-packages-in-docker.sh`) mounts `${REPO_ROOT}:/repo` (whole repo including `services/api/`) and runs `npm ci`. In npm 10's degraded-workspace-resolution mode, that `npm ci` silently omits api workspace devDependencies (`tsc`, `vitest`, `tsx`), leaving `services/api/node_modules` at ~42 packages instead of ~140. If the api container is RUNNING during this, tsx watch dies from the build's subsequent `unlink` events (tries to hot-reload, can't find its own preflight.cjs), api crash-loops, `/api/health` returns 502 through Nginx for the rest of the slot. Stopping api before the build avoids the entire failure mode.
5. **Never use `docker compose restart api` during a slot's execution.** The restart re-runs the container's startup `sh -c "npm install && npm run dev"`; that `npm install` can re-prune devDeps the same way. Stop/start sequencing is reserved exclusively for the step-5 block above.
6. **`--include=dev` is REQUIRED for the host-side install** (surfaced during slot 2): when run against a workspace-flavored `package.json` whose `file:../../packages/...` deps can't resolve from `/app`'s perspective, npm 10's degraded resolution mode treats this as a production install and silently omits devDependencies. Always pass the flag.
7. **In step 6 verification — `apps/web` typecheck is excluded from CI by explicit decision** (surfaced during slot 5; see [`.github/workflows/typecheck.yml`](../../.github/workflows/typecheck.yml) header + `docs/TYPING.md` Phase 4 + `docs/TAMAGUI.md`). Local `apps/web` typecheck currently produces ~1000–1100 errors, ~99% of them `TS2322` in the documented accepted-cost Tamagui shorthand-prop / theme-token class (`mt`/`mb`/`bg`/`minW`/`items`, etc.). **Do NOT treat these as a slot regression.** The proper web verification for a slot is the Nginx smoke through the gateway (`curl http://localhost:18080/en/dashboard`, `/en/recipes`, etc.). Sniff check: `npm run typecheck 2>&1 | grep -oE "error TS[0-9]+" | sort | uniq -c | sort -rn` — TS2322 should dominate by ≥98%; if a different code dominates, escalate.
8. **If the renamed package is consumed by `apps/native`, native typecheck via host one-shot container WILL prune the api bind-mount** (surfaced during slot 5). The standard invocation
   ```bash
   docker run --rm -v "$PWD:/repo" -w /repo/apps/native node:20-slim \
     bash -lc 'cd /repo && npm install --no-audit --no-fund && cd apps/native && npm run typecheck'
   ```
   runs `npm install` against the workspace root inside a one-shot container — the SAME root cause as step 5's build script. The api appears healthy (`/api/health` returns `{"ok":true}` because tsx is loaded into the running process's memory) but `/app/node_modules/.bin/` is left with ~8 entries (no `tsc`/`tsx`/`vitest`); any subsequent `docker compose exec api npm run typecheck` or `npm run test` fails with `tsc: not found`. **Recovery is the same STOP-install-START sequence as step 5 minus the build:**
   ```bash
   docker compose stop api
   docker run --rm -v "$PWD/services/api:/app" -w /app node:20-slim \
     bash -lc 'npm install --include=dev --no-audit --no-fund'
   docker compose start api
   curl -sS http://localhost:18080/api/health   # expect {"ok":true}
   docker compose exec api sh -c 'ls /app/node_modules/.bin/ | grep -E "^(tsc|tsx|vitest)$" | sort'   # expect all 3
   ```
   **Preferred ordering:** run native typecheck BEFORE step 5 (api is already stopped from step 5a), eliminating the recovery cycle entirely.
9. **For slots with >50 source-import files (slot 5 was the first), bulk sed is justified** but the post-character class in the substitution regex MUST mirror the inventory grep verbatim — `[^a-zA-Z0-9_-]` (no `/` in the exclusion class because subpath imports legitimately follow with `/`). Slot 5 hit this trap on first attempt: an overcautious `[^a-zA-Z0-9_/-]` missed all the subpath imports (e.g. `@brewery/ui/tamagui-config-web`); confirmed by post-sweep `grep -rl` showing the residual files. The safety regex is canonical — do NOT add characters to the exclusion class.
10. **Slot-5 gotcha refinement: only `npm install` (or `npm ci`) prunes the api bind-mount — `npm run <script>` does NOT.** Surfaced during slot 6 step 6 verification: ran `docker run --rm -v "$PWD:/repo" -w /repo node:20-slim bash -lc 'npm run test:packages'` to exercise the renamed workspace through the same one-shot container CI uses, and confirmed api `/app/node_modules/.bin/` retained `tsc`/`tsx`/`vitest` afterwards. **Practical implication:** when a slot's step 6 verification only needs to *run* an existing script (not install), the one-shot container shape is safe and you do NOT need the STOP-install-START recovery. Only explicit `npm install` or `npm ci` against the workspace root triggers the dep-resolution / pruning pass. (This refinement narrows item 8 to its precise trigger; the STOP-install-START recovery is still required when an `npm install` is actually present.)
11. **Bulk-sed self-exclusion for TRAP slots with historical descriptions.** When step 1's classifying description deliberately contains a historical reference to the old name — e.g. for a brewery-vertical TRAP slot the description might read `"Renamed from @brewery/core to @umbraculum/brewery-core (NOT @umbraculum/core) as sub-plan #9 slot 6"` — the bulk sed in step 3 would re-substitute the embedded `@brewery/core` and corrupt the historical string. **Exclude the just-edited `packages/<name>/package.json` from the bulk-sed target list** (alongside the always-excluded `brewery-scope-migration-*` docs). Slot 6 caught this risk during step 3 planning: file list went 20 → 17 by excluding `packages/core/package.json` + 2 migration history docs; post-sweep `grep -rl '@brewery/core'` returned only those 3 intentional-history files, and the description preserved verbatim. **Surfaced during slot 6.**
12. **Bulk-sed must also exclude the migration plan + handoff docs** — they preserve historical "Source name" cells in §1.1 / §1.4 / §3.1 / §4 tables that a naive scope-wide sed will overwrite (`| @brewery/<name> | ... | @umbraculum/<name> | ...` becomes `| @umbraculum/<name> | ... | @umbraculum/<name> | ...`, losing the historical record). Slot 5 avoided this implicitly via a curated `sed` file list; slot 7's Python-based sweep included the docs and had to restore 4 cells in the plan doc + 3 in the handoff doc post-bulk. **Combined exclusion list for step 3 is now 3 paths minimum:** (a) own `packages/<name>/package.json` (item 11), (b) `<REPO_ROOT>/docs/design/brewery-scope-migration-plan.md`, (c) `<REPO_ROOT>/docs/design/brewery-scope-migration-per-package-handoff.md`. **Surfaced during slot 7.**
13. **Substring-collision sanity check — 4-cousin discipline** (expanded from 2-cousin during slot 8). The canonical regex `@brewery/<name>([^a-zA-Z0-9_-]|$)` defends against three of the four cousin patterns structurally; the fourth requires a positive verification. Before bulk-running, walk all four:
    1. **(a) Longer-prefix in old scope** (`@brewery/<X>-<Y>` when renaming `@brewery/<X>` — slot-7 case: `@brewery/i18n-react` during the `@brewery/i18n` rename). The regex tail's `-` (in positive set, NOT negated) correctly skips these. Verify via `grep -rohE "@brewery/<name>[a-zA-Z0-9_/.-]+" --exclude-dir=node_modules --exclude-dir=dist .` — should return ONLY this workspace's intentional export subpaths.
    2. **(b) Shorter-prefix in old scope** (`@brewery/<X>` when renaming `@brewery/<X>-<Y>` — slot-8 case: `@brewery/i18n` while renaming `@brewery/i18n-react`). Structurally impossible to corrupt because the regex's literal `<name>-<suffix>` prefix can never match a literal `<name>` mid-string. No grep needed.
    3. **(c) Just-renamed sibling in new scope** (`@umbraculum/<sibling-already-migrated>` from a previous slot — slot-8 case: `@umbraculum/i18n` from slot 7). Structurally impossible because the regex's literal `@brewery/` prefix is distinct from `@umbraculum/`. No grep needed.
    4. **(d) Export subpath of the package itself** (`@brewery/<name>/<subpath>` — e.g. `@brewery/i18n-react/next-intl`, `@brewery/i18n/en`). The regex tail's `/` (NOT in `[a-zA-Z0-9_-]` positive set, so IS in negated tail) correctly MATCHES + substitutes these. Verify via `grep -rohE "@brewery/<name>[/a-zA-Z0-9_.-]+" --exclude-dir=node_modules --exclude-dir=dist . | sort -u` — every match should be either the bare name or a known export subpath (no surprise paths).

    Slot 7 verified cousins (a) + (d) empirically; slot 8 added cousins (b) + (c) explicitly (because `@brewery/i18n-react` re-introduced the longer-name perspective AND the just-renamed-sibling `@umbraculum/i18n` perspective at the same time). Apply the full 4-cousin walk to any future slot. **Surfaced + refined across slots 7 + 8.**

14. **MANDATORY pre-push: run `npx @umbraculum/ci-parity`** (or `bash <REPO_ROOT>/scripts/ci-parity-check.sh`) — reproduces static-analysis CI jobs from `.umbraculum/ci-parity.json` against a clean `git archive HEAD` snapshot (~2 min). Run as the LAST step before `git push` on every slot commit. If any job FAILs, fix locally and re-run — do NOT push expecting CI to "tell us what's wrong". See `docs/CI-PARITY.md` and rule `72-ci-parity-local-vs-ci-divergence`.

15. **Forecast-becomes-live tautology purge (post-sweep step 3b).** Brewery-vertical slots create cross-package README forecasts of the form `(will be renamed to @umbraculum/brewery-<name> in slot N)` in sibling packages' READMEs, in the per-package handoff doc, and in the plan doc — these become tautological/self-referential the moment the rename lands and must be cleaned up. After the bulk-sed sweep (item 12 excludes own `package.json` + the two migration docs), run a targeted grep on the freshly-renamed name:
    ```bash
    grep -rn "will be renamed to @umbraculum/brewery-<name>" \
      --exclude-dir=node_modules --exclude-dir=dist <REPO_ROOT>
    grep -rn "@umbraculum/brewery-<name> .*pending" \
      --exclude-dir=node_modules --exclude-dir=dist <REPO_ROOT>
    ```
    For each hit, rewrite the parenthetical to past-tense factual form (`renamed from @brewery/<name>` / `landed in slot N`), OR remove if redundant. Slot 12 left 2 such tautologies untouched (caught later by slot 13 cleanup); slot 13's larger doc-tier footprint created 6 new ones + the 2 from slot 12 = 8 sites cleaned in slot 13's cleanup pass. **Surfaced during slot 13** (third brewery-vertical; the pattern surfaces specifically in vertical-prefixed slots because `@umbraculum/brewery-*` is the predictable target-name shape that gets pre-quoted by sibling packages anticipating the rename).

16. **Operational closing-condition for the closer slot of a multi-slot scope migration** (slot 14 in sub-plan #9). The literal closing-condition `grep -rE "@brewery/[a-z]" returns ZERO outside excluded paths` is **unachievable as written** at sub-plan closure: 25-30 historical references legitimately remain as audit-trail records — README "Renamed from `@brewery/<name>`" NOTE-blocks, plan/handoff doc recap sections, RFC narrative recording the rename. The **operational form** distinguishes:
    - **LIVE references (must be zero):** workspace `name` fields, `dependencies` keys, source imports, `apps/web/next.config.js` `transpilePackages`, `apps/native/metro.config.js` aliases, build/test/script invocations, CI workflow job names + step display names, lockfile `name`/`resolved`/symlink-target entries.
    - **HISTORICAL references (intentionally retained):** `package.json` `description` fields recording the rename, README NOTE-blocks, plan/handoff doc prose, immutable RFC narrative, "audit-trail" sections in foundation-hardening / rename-diligence docs, `prisma/*.prisma` comment headers when the schema lived under the old name.
    
    At the closer slot, do NOT fail on literal-grep hits; instead **categorize** each hit as live-vs-historical and verify ALL hits are deliberate historical records. Slot 14 ran the literal grep, got 26 file matches, categorized them as 7 description fields + 6 README NOTE-blocks + 1 prisma comment + 1 design-doc rename-history sentence + 1 contracts-validation F5 row + 8 own-slot rename-history sentences + 2 always-excluded migration docs — all 26 deliberate. The literal grep remains a useful diagnostic (it's how you BUILD the categorization), but the operational categorization is the authoritative pass/fail gate at sub-plan closure. **Surfaced during slot 14** (the closer of sub-plan #9). For the next package-scope rename project, this item replaces "literal grep returns zero" as the closer-slot acceptance criterion in the recipe; literal-grep stays as a per-slot diagnostic earlier in the migration.

## Local-subagent-future readiness

Input-driven (3 named placeholders), output-constrained (Prerequisites / Commands / Stop conditions / Result), bounded (max 7 commands, hard inventory cap at 50, no loops). Suitable for a future Ollama local-model variant invoked by the per-slot subagent listed in sub-plan #9 §3. Operator follow-up item 14 (pre-push `ci-parity-check.sh`) is a separate bounded surface (~2 min) intended to be invoked by the slot operator before `git push`, not by this skill itself; it sits between the slot subagent and the eventual CI run as a parity gate.
