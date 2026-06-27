# Cursor marketplace C2 — manifest layout and submission

| Field | Value |
|---|---|
| **Status** | Active — repo-root marketplace manifest prepared for public-alpha C2 submission |
| **Owner** | umbraculum-toolset maintainers |
| **Last updated** | 2026-06-27 |

## Purpose

Prepare **three** umbraculum-dev apparatus plugins for Cursor marketplace submission (public-alpha C2) while keeping:

- Plugin folders under `cursor-plugins/` (unchanged — hooks use `$UMB_BASE/...` absolute paths).
- `umbraculum-openplc-python-cursor-assistant/` on disk for **hook-only** install (not listed in marketplace manifest until the OpenPLC sister repo is public).

## Source of truth

| Artifact | Path |
|---|---|
| Marketplace manifest (SoT) | [`.cursor-plugin/marketplace.json`](../../.cursor-plugin/marketplace.json) at **git repo root** |
| Plugin pack root | `cursor-plugins/` via `metadata.pluginRoot` |
| Per-plugin manifest | `cursor-plugins/<plugin-name>/.cursor-plugin/plugin.json` |

**Removed (2026-06-27):** nested `cursor-plugins/.cursor-plugin/marketplace.json` — do not recreate; it caused doc/indexer drift.

### Layout diagram

```
umbraculum-toolset/                         ← submit this GitHub repo URL
├── .cursor-plugin/marketplace.json         ← Cursor indexer reads this (3 plugins)
├── packages/ci-parity/                     ← not in marketplace manifest
└── cursor-plugins/                         ← pluginRoot
    ├── umbraculum-toolset-common/          ← listed
    ├── umbraculum-node-react-cursor-assistant/   ← listed
    ├── umbraculum-platform-tsjs-cursor-assistant/  ← listed
    └── umbraculum-openplc-python-cursor-assistant/ ← hook-only, NOT listed
```

## What did NOT change

- **`workspaceOpen` hook scripts** — still `add "$UMB_BASE/<plugin-name>"`; never read `marketplace.json`.
- **Plugin folder paths** — no moves to repo root.
- **OpenPLC on disk** — folder and `plugin.json` remain; only omitted from `plugins[]` whitelist.

## Marketplace vs hook (independent)

| Mechanism | Controls |
|---|---|
| `marketplace.json` `plugins[]` | Which plugins Cursor **lists** after repo submission |
| Hook `add()` lines | Which plugins load **locally** per workspace |

Omitting OpenPLC from the manifest does **not** uninstall or block hook loading.

## Submit checklist (maintainer)

1. Read [Cursor Publisher Terms](https://cursor.com/marketplace-publisher-terms).
2. Run [Verification](#verification-local-pre-commit) below — all OK.
3. Open [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) (signed into Cursor account).
4. Submit repository URL: `https://github.com/umbraculum-dev/umbraculum-toolset`
5. In the application notes, state explicitly:
   - Marketplace manifest: `.cursor-plugin/marketplace.json` at repo root
   - `metadata.pluginRoot`: `cursor-plugins`
   - **Three** plugins listed (common, node-react, platform-tsjs) for umbraculum-dev
   - OpenPLC plugin deferred — remains in repo for hook install only
   - License: MIT (repo root + per listed plugin)
6. Wait for manual review (no SLA). **C2 closure for flip runbook:** submission started; **live listings** may trail by days/weeks.

Consumer install doc (post-approval): [umbraculum-dev `docs/CURSOR-PLUGINS.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CURSOR-PLUGINS.md).

## Verification (local, pre-commit)

Run from repo root (`/path/to/umbraculum-toolset`):

```bash
cd /path/to/umbraculum-toolset

# JSON syntax
jq empty .cursor-plugin/marketplace.json

# Exactly three marketplace plugins; no OpenPLC
jq -r '.plugins[].name' .cursor-plugin/marketplace.json | sort
# expect: umbraculum-node-react-cursor-assistant
#         umbraculum-platform-tsjs-cursor-assistant
#         umbraculum-toolset-common

# pluginRoot
jq -r '.metadata.pluginRoot' .cursor-plugin/marketplace.json
# expect: cursor-plugins

# Listed plugin manifests exist
for p in umbraculum-toolset-common umbraculum-node-react-cursor-assistant umbraculum-platform-tsjs-cursor-assistant; do
  test -f "cursor-plugins/$p/.cursor-plugin/plugin.json" && test -f "cursor-plugins/$p/LICENSE" && echo "OK $p"
  test -f "cursor-plugins/$p/assets/umbi.svg" && jq -e '.logo == "assets/umbi.svg"' "cursor-plugins/$p/.cursor-plugin/plugin.json" >/dev/null && echo "OK $p logo"
done

# Hook-only OpenPLC still on disk
test -f cursor-plugins/umbraculum-openplc-python-cursor-assistant/.cursor-plugin/plugin.json && echo "OK openplc hook path"

# Nested manifest must NOT exist (SoT is repo root only)
test ! -e cursor-plugins/.cursor-plugin/marketplace.json && echo "OK no nested marketplace.json"
```

Optional: confirm no stale doc references:

```bash
rg 'cursor-plugins/\.cursor-plugin/marketplace' --glob '!docs/archive/**'
# expect: no matches (or only this runbook's "Removed" note)
```

## Rollback procedure

Use if Cursor indexer rejects the layout, or a pre-submit mistake must be reverted **before** consumers depend on the new paths.

### Full revert via git (after this change was committed)

```bash
cd /path/to/umbraculum-toolset
git log -1 --oneline   # note the manifest commit SHA
git revert <commit-sha> --no-edit
# or: git restore --source=<parent-sha> -- .cursor-plugin/ cursor-plugins/
```

### Manual revert (uncommitted or selective)

1. **Restore nested manifest** from git history:
   ```bash
   git show HEAD~1:cursor-plugins/.cursor-plugin/marketplace.json > cursor-plugins/.cursor-plugin/marketplace.json
   ```
2. **Remove repo-root manifest:**
   ```bash
   rm -f .cursor-plugin/marketplace.json
   rmdir .cursor-plugin 2>/dev/null || true
   ```
3. **Revert plugin.json / LICENSE** on the three listed plugins if needed:
   ```bash
   git restore cursor-plugins/umbraculum-toolset-common/.cursor-plugin/plugin.json
   git restore cursor-plugins/umbraculum-node-react-cursor-assistant/.cursor-plugin/plugin.json
   git restore cursor-plugins/umbraculum-platform-tsjs-cursor-assistant/.cursor-plugin/plugin.json
   git restore cursor-plugins/umbraculum-toolset-common/LICENSE
   git restore cursor-plugins/umbraculum-node-react-cursor-assistant/LICENSE
   git restore cursor-plugins/umbraculum-platform-tsjs-cursor-assistant/LICENSE
   ```
4. **Hooks:** no action — they never depended on `marketplace.json`.
5. Re-run hook verification: [`WORKSPACE-PLUGIN-LOADING.md` §5](./WORKSPACE-PLUGIN-LOADING.md#5-verification-checklist).

### Partial rollback (indexer rejects `pluginRoot` only)

If Cursor asks for a different layout, prefer adjusting repo-root `marketplace.json` (`pluginRoot`, descriptions) **without** moving plugin folders. Document the outcome in this file's changelog table below.

## Post-approval migration

When the three marketplace listings go live:

1. Install from **Cursor → Settings → Plugins** — **three only**, per workspace (umbraculum-dev).
2. Remove matching `add()` lines from `~/.cursor/hooks/register-workspace-plugins.sh` to avoid double-load.
3. See [`WORKSPACE-PLUGIN-LOADING.md` §4](./WORKSPACE-PLUGIN-LOADING.md#4-post-publication-marketplace-install--workspaceopen-hook-coexistence).

## Changelog

| Date | Change |
|---|---|
| 2026-06-27 | Marketplace logos: `docs/media/umbi.{png,svg}`; each listed plugin `assets/umbi.svg` + `"logo": "assets/umbi.svg"` in `plugin.json` |
| 2026-06-27 | C2 prep: repo-root `.cursor-plugin/marketplace.json` with `pluginRoot: cursor-plugins`; three plugins only; nested manifest removed; per-plugin LICENSE + enriched `plugin.json` on listed three |

## Related docs

- Hook install (unchanged): [`WORKSPACE-PLUGIN-LOADING.md`](./WORKSPACE-PLUGIN-LOADING.md)
- Roadmap / marketplace realism: [`PLUGIN-ROADMAP.md`](./PLUGIN-ROADMAP.md)
- umbraculum-dev consumer doc: [`docs/CURSOR-PLUGINS.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CURSOR-PLUGINS.md)
- Flip runbook §5: [`public-alpha-flip-day-runbook.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/design/public-alpha-flip-day-runbook.md)
