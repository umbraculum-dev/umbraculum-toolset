# Workspace-scoped plugin loading and marketplace interaction

| Field | Value |
|---|---|
| **Status** | Living document |
| **Owner** | umbraculum-toolset maintainers |
| **Audience** | developers running these plugins alongside other Cursor plugins, and future maintainers preparing the umbraculum-toolset plugins for Cursor Marketplace publication |
| **Last meaningful update** | 2026-06-11 (rollout: hook + empty `local/`; legacy `install-local.sh.legacy`) |
| **Rollout status** | **Active** on maintainer machine — `~/.cursor/hooks.json` + `register-workspace-plugins.sh`; `~/.cursor/plugins/local/` empty for umbraculum and rf-magento plugins |

This document complements [`PLUGIN-ROADMAP.md`](./PLUGIN-ROADMAP.md). The roadmap covers private-vs-marketplace transition (§3), the loader-consumed manifest field set (§5), and the symlink-loader bug (§1b). This document covers two adjacent, frequently-asked questions:

1. **"What can the plugin manifest itself express?"** — i.e. can a plugin self-gate loading by workspace, by marker file, by language? (Short answer: no. Section 2 below.)
2. **"What happens to the local `workspaceOpen` hook setup once these plugins are published to the Cursor Marketplace?"** — i.e. do the two mechanisms conflict? (Short answer: they don't coordinate, but they don't block each other either; the developer picks per plugin. Section 4 below.)

---

## 1. Why this exists

A developer using these plugins typically has at least two workspace categories on the same machine:

- Workspaces where a given umbraculum-toolset plugin **should** load (e.g. `umbraculum-platform-tsjs-cursor-assistant` in an umbraculum-platform repo, `umbraculum-openplc-python-cursor-assistant` in the openplc/brewery sister-repo).
- Workspaces where it **shouldn't** load — because the plugin's `alwaysApply: true` rules would be off-topic, the always-on rule count would inflate the context cost per prompt, or the plugin's domain assumptions don't fit (e.g. PLC variable-prefix conventions in a TS/JS-only repo).

Cursor's default behavior is to load every plugin under `~/.cursor/plugins/local/` into every workspace. The plugin manifest does not provide a self-gating mechanism. The realistic options for narrowing the per-workspace plugin set are documented below, in increasing order of strictness:

| Option | Strictness | Effort |
|---|---|---|
| Component-level toggles (Settings → Rules / Settings → Features → MCP) | Mute specific rules / MCP servers of an installed plugin | Per-workspace UI clicks |
| **`workspaceOpen` hook** (this document, §3) | Plugin-level: load only when the workspace path matches | One-time script setup |
| Marketplace per-workspace toggle (post-publication; §4) | Plugin-level via Cursor GUI | One install action per workspace |

Most cases are fine with component-level toggles. The `workspaceOpen` hook is the option to reach for when entire plugins should not load in a given workspace.

---

## 2. What the manifest can express (the "local publication" answer)

A locally-installed Cursor plugin is a directory containing a `.cursor-plugin/plugin.json` manifest plus the component folders the manifest points at. The full set of fields Cursor's loader actually consumes was enumerated empirically by reading the unpacked Cursor binary (`cursor-agent-exec/dist/main.js`):

```
name (a.k.a. displayName)
description
version
authorName
variablesSchema
rules
skills
agents
commands
hooks
mcpConfig (a.k.a. mcpServers)
```

Cross-referenced against the published Elastic / Figma / Prisma marketplace plugin manifests (whose source-of-truth shape is visible in `~/.cursor/plugins/cache/cursor-public/<name>/<sha>/.cursor-plugin/plugin.json`): none of them declares any field outside that set.

### What the manifest does NOT support

The following fields are sometimes wished-for but **do not exist** in the schema today:

| Wished-for field | What it would do | Status |
|---|---|---|
| `dependsOn` / `requires` / `recommends` | Auto-install / suggest a companion plugin | **Not consumed.** Pairing recommendations are README-level and installer-script-level only. See [`PLUGIN-ROADMAP.md` §5](./PLUGIN-ROADMAP.md#5-open-questions). |
| `workspaceMatcher` (e.g. `"**/composer.json"`) | Load the plugin only when a marker file is present in the workspace | **Not consumed.** No equivalent field exists; conditional loading is handled by the `workspaceOpen` hook (§3 below), not by the manifest. |
| `enabledWhen` / `conditionalLoad` | Load the plugin based on workspace path / language / glob | **Not consumed.** Same as above. |
| `pairsWith` / `companionOf` | Declare that another plugin is required alongside this one | **Not consumed.** Same as above. |

### Implication for the umbraculum-toolset plugins

The manifest is **structural metadata only** — name, version, author, and pointers to component folders. It cannot self-gate loading. A plugin that should not load in workspace W is either (a) not installed into `~/.cursor/plugins/local/` at all, or (b) installed but excluded by the `workspaceOpen` hook for that workspace. There is no third option that lives in `plugin.json` itself.

This applies equally to the local-folder install today and to a hypothetical future marketplace publication — Cursor's loader consumes the same manifest fields in either case.

---

## 3. Workspace-scoped loading via `workspaceOpen` hook

The `workspaceOpen` hook is the documented Cursor mechanism for per-workspace plugin selection. Reference: <https://cursor.com/docs/hooks#workspaceopen>.

### Mechanism

- Fires when Cursor opens a workspace, and again on every workspace folder change.
- Skipped when the window has zero workspace folders.
- **Input** (stdin, JSON): includes `workspace_roots: ["<absolute path>", ...]` and `hook_event_name: "workspaceOpen"`.
- **Output** (stdout, JSON): `{ "pluginPaths": ["<absolute path>", ...] }` — absolute paths to plugin directories to load **for the current workspace**.
- Lives in `~/.cursor/hooks.json` (user-level) or `<repo>/.cursor/hooks.json` (project-level). For multi-repo gating across unrelated projects, user-level is the natural fit.

### Critical behavior: the hook **adds** paths, it does not replace

The docs phrase it as "additional plugin paths to load for the current workspace." Empirical implication:

- Plugins still in `~/.cursor/plugins/local/<name>/` load **globally**, regardless of what the hook returns. The hook cannot deregister them.
- To get strict per-workspace scoping for plugin X via the hook, X must be **removed from `~/.cursor/plugins/local/`** (i.e. not rsync'd by `install-local.sh.legacy`) AND registered by the hook only for the workspaces where it should load.

If your goal is "load `umbraculum-openplc-python-cursor-assistant` only in the openplc/brewery repo and nowhere else," the sequence is:

1. Skip rsync'ing it into `~/.cursor/plugins/local/`.
2. Register its source path (`/path/to/umbraculum-toolset/cursor-plugins/umbraculum-openplc-python-cursor-assistant`) from the hook only when the workspace root matches the openplc/brewery repo path.

### Skeleton: `~/.cursor/hooks.json`

```json
{
  "version": 1,
  "hooks": {
    "workspaceOpen": [
      { "command": "./hooks/register-workspace-plugins.sh" }
    ]
  }
}
```

The relative path `./hooks/register-workspace-plugins.sh` resolves to `~/.cursor/hooks/register-workspace-plugins.sh` per the Cursor docs' user-hook working-directory rule.

### Skeleton: `~/.cursor/hooks/register-workspace-plugins.sh`

```bash
#!/usr/bin/env bash
# workspaceOpen hook — register umbraculum-toolset plugins from their source
# folders only for the workspaces they apply to. Avoids loading every plugin
# into every workspace.
#
# Reads workspace_roots (JSON) from stdin, returns pluginPaths (JSON) on stdout.
set -euo pipefail

# Adjust to wherever you keep the umbraculum-toolset source repo on this machine.
UMB_BASE="/path/to/umbraculum-toolset/cursor-plugins"

# Adjust to your actual repo locations.
UMBRACULUM_PLATFORM_REPO="/path/to/umbraculum-dev"
OPENPLC_PROJECT_REPO="/path/to/openplc-brewery-project"
MAGENTO_PLUGIN="/path/to/magento-workspace/cursor-rules/cursor-plugins/rf-magento-cursor-assistant"
MAGENTO_WORKSPACE_PREFIX="/path/to/magento-workspace/"

input="$(cat)"
roots="$(printf '%s' "$input" | jq -r '.workspace_roots[]?')"

paths=()
add() {
  if [[ -d "$1" && -f "$1/.cursor-plugin/plugin.json" ]]; then
    paths+=("$1")
  fi
}

while IFS= read -r root; do
  case "$root" in
    "$UMBRACULUM_PLATFORM_REPO"*)
      add "$UMB_BASE/umbraculum-toolset-common"
      add "$UMB_BASE/umbraculum-node-react-cursor-assistant"
      add "$UMB_BASE/umbraculum-platform-tsjs-cursor-assistant"
      ;;
    "$OPENPLC_PROJECT_REPO"*)
      add "$UMB_BASE/umbraculum-toolset-common"
      add "$UMB_BASE/umbraculum-openplc-python-cursor-assistant"
      ;;
    "$MAGENTO_WORKSPACE_PREFIX"*)
      # Magento pairing: common + rf-magento (v0.2.0+); NOT node-react/platform/openplc.
      add "$UMB_BASE/umbraculum-toolset-common"
      add "$MAGENTO_PLUGIN"
      ;;
    *)
      # Default: meta-framework baseline on every other workspace.
      add "$UMB_BASE/umbraculum-toolset-common"
      ;;
  esac
done <<<"$roots"

if [ "${#paths[@]}" -eq 0 ]; then
  printf '{}\n'
else
  printf '%s\n' "${paths[@]}" \
    | sort -u \
    | jq -R . \
    | jq -s '{pluginPaths: .}'
fi
```

Make the script executable: `chmod +x ~/.cursor/hooks/register-workspace-plugins.sh`.

### Interaction with the symlink-loader bug

The `workspaceOpen` hook returns **absolute paths to real directories**, not symlinks; it is not affected by the symlink-loader bug documented in [`PLUGIN-ROADMAP.md` §1b](./PLUGIN-ROADMAP.md#1b-cursor-bug-local-plugin-loader-rejects-symlinks-discovered-2026-05-18). Hook-registered plugins are read directly from the source repo path; no rsync mirror is needed.

### Cloud agents

`workspaceOpen` is on Cursor's documented list of hooks that **do not run in cloud agents** (it's an IDE lifecycle hook). Cloud-agent invocations of these plugins would need a different strategy (typically: project-level `<repo>/.cursor/hooks.json` for the hooks cloud agents do support, plus the plugins committed in the repo via the consumer-project route). Out of scope for the typical local-developer setup.

---

## 4. Post-publication: marketplace install + `workspaceOpen` hook coexistence

When any of the umbraculum-toolset plugins is eventually published to the Cursor Marketplace (see [`PLUGIN-ROADMAP.md` §3.F](./PLUGIN-ROADMAP.md#f-concrete-blockers-to-close-before-any-marketplace-submission) for the prerequisite blockers), a developer's machine may have **two independent sources** for the same plugin:

| Source | Where the plugin loads from | How it is controlled |
|---|---|---|
| Marketplace install | `~/.cursor/plugins/cache/cursor-public/<name>/<git-sha>/` (Cursor clones the published Git repo into the cache) | "Add for Myself" + per-workspace toggle in **Settings → Plugins**; tracked in `~/.config/Cursor/User/globalStorage/state.vscdb`'s `cursor.plugins.installedIds.no-team\|...` rows |
| `workspaceOpen` hook | Whatever absolute path the discriminator script returns | The script's path-matching logic |

These two mechanisms do not coordinate. Each loads its plugin independently.

### Concrete failure mode to avoid: double-load

If the marketplace version of plugin X is installed for workspace W **and** the `workspaceOpen` hook also returns a local path to plugin X for workspace W, Cursor sees two copies of the same plugin from two different paths. The docs don't promise whether Cursor de-duplicates or double-registers in this case — best treated as undefined. Symptoms to watch for if the situation occurs:

- Rules from plugin X appear twice in agent rule introspection.
- A specific rule's guidance fires twice in agent reasoning chains.
- `~/.config/Cursor/logs/<session>/window<N>/exthost/anysphere.cursor-agent-exec/Cursor Plugins.log` shows the plugin name loaded from two different paths.

### Clean migration when a plugin gets published

For each umbraculum-toolset plugin as it becomes available on the marketplace:

1. Install it via **Cursor Marketplace** (the marketplace panel inside Cursor).
2. Scope it per workspace using the Plugins panel: "Add for Myself" for user-scope inclusion across all workspaces, or per-workspace install for selective enablement. Per [`PLUGIN-ROADMAP.md`](./PLUGIN-ROADMAP.md) §2.1 the effective enablement per workspace is the union of the user-scope and workspace-scope `state.vscdb` rows.
3. Remove the corresponding `add "$UMB_BASE/<plugin-name>"` line from `~/.cursor/hooks/register-workspace-plugins.sh`.
4. Restart Cursor (or **Developer: Reload Window**) and verify in Settings → Plugins that the plugin appears once, sourced from the marketplace cache path.

### When to keep using the `workspaceOpen` hook even post-publication

The hook is **not** a stopgap that gets retired on publication day. Cases where it remains the right tool:

- **Testing local HEAD or feature-branch builds** against a real workspace. The marketplace cache holds a published Git SHA; the hook can point at the working copy in `/path/to/umbraculum-toolset/cursor-plugins/<plugin-name>/` and pick up uncommitted changes immediately on workspace reopen.
- **Pinning to a specific local revision** during a refactor that's intentionally not yet shipped.
- **Plugins outside umbraculum-toolset scope** that aren't (and won't be) published. These would stay registered via the hook indefinitely.

The natural end state on a mature developer machine is therefore:

| Plugin category | Loading mechanism |
|---|---|
| umbraculum-toolset plugins (post-publication, steady state) | Marketplace install + per-workspace toggle in **Settings → Plugins** |
| umbraculum-toolset plugins (during local HEAD development of the plugin itself) | `workspaceOpen` hook pointing at the working copy |
| Non-umbraculum-toolset plugins not published anywhere | `workspaceOpen` hook OR globally via `~/.cursor/plugins/local/` (developer's choice based on whether they want per-workspace scoping) |

---

## 5. Verification checklist

After any change to either `~/.cursor/plugins/local/` (the rsync target) or `~/.cursor/hooks.json` / `~/.cursor/hooks/register-workspace-plugins.sh`:

1. **Reload Cursor** — either restart the application or **Ctrl+Shift+P → Developer: Reload Window**. The `hooks.json` watcher reloads config automatically, but the `workspaceOpen` hook only fires on workspace open / folder change.
2. **Settings → Plugins** — confirm the expected plugins appear under "Installed" for the current workspace and the unexpected ones do not. Marketplace-installed plugins carry a source badge per [`PLUGIN-ROADMAP.md` §2.1](./PLUGIN-ROADMAP.md); hook-registered ones do not.
3. **Settings → Hooks** — the docs mention a Hooks tab for debugging configured + executed hooks. Inspect the `workspaceOpen` hook's last execution and confirm the `pluginPaths` returned matches what you expect for the current workspace.
4. **Plugin loader log** — `~/.config/Cursor/logs/<session>/window<N>/exthost/anysphere.cursor-agent-exec/Cursor Plugins.log` records `loadUserLocalPlugin <name> loaded in N.Nms` lines per plugin loaded. Each plugin name should appear once. A plugin name appearing twice with two different paths is the double-load smoke signal from §4.
5. **Agent rule introspection** — open a new chat in the target workspace. If you have a plugin-specific witness rule with `alwaysApply: true` (see [`README.md` § "Witness-rule contract for downstream `AGENTS.md` consumers"](../README.md#witness-rule-contract-for-downstream-agentsmd-consumers)), the agent should be able to quote it. If it cannot, the plugin did not load.

---

## 6. See also

- [`PLUGIN-ROADMAP.md`](./PLUGIN-ROADMAP.md) §1b — Cursor symlink-loader bug (affects `~/.cursor/plugins/local/` only; not the `workspaceOpen` hook).
- [`PLUGIN-ROADMAP.md`](./PLUGIN-ROADMAP.md) §3 — Private-vs-marketplace plugin transition (manifest schema gap, content hygiene, distribution mechanics, marketplace-realism per plugin, blockers before submission).
- [`PLUGIN-ROADMAP.md`](./PLUGIN-ROADMAP.md) §5 — Loader-consumed manifest field enumeration (the empirical basis for §2 above).
- [`../README.md`](../README.md) § "Per-project enablement" — short version of the same `workspaceOpen` recommendation, embedded in the install instructions.
- Cursor docs: <https://cursor.com/docs/hooks#workspaceopen> — official `workspaceOpen` hook reference.
- Cursor docs: <https://cursor.com/docs/plugins> — official plugin overview (manifest, marketplace, local plugins).
