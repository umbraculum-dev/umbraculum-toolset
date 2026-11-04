#!/usr/bin/env bash
# EXAMPLE — multi-workspace maintainer layout: copy to ~/.cursor/hooks/register-workspace-plugins.sh
# and chmod +x. umbraculum-dev-only contributors should prefer
# register-workspace-plugins.umbraculum-dev.example.sh instead.
# Canonical install doc: cursor-plugins/docs/WORKSPACE-PLUGIN-LOADING.md §0
#
# Extending beyond React/TS: umbraculum-toolset-common is safe to load in *every*
# workspace (git/DCO/commit discipline). Domain plugins are not interchangeable —
# this hook can register very different application stacks per path, not only
# React/TS. Example pattern (sibling domain plugins outside this repo):
#   On a Mage-OS / PHP shop path → add umbraculum-toolset-common FIRST, then that
#   stack's domain plugin(s) from their source folder. Same idea for any other
#   non-JS monorepo that adopts the common meta-framework.
# Do not rsync domain plugins into ~/.cursor/plugins/local/ (global load / double-load).
#
# workspaceOpen hook — register Cursor plugins from source paths per workspace.
# Reads workspace_roots (JSON) from stdin; returns pluginPaths (JSON) on stdout.
set -euo pipefail

UMB_BASE="${UMB_TOOLSET_ROOT:-/path/to/umbraculum-toolset}/cursor-plugins"
UMBRACULUM_PLATFORM_REPO="${UMBRACULUM_DEV_ROOT:-/path/to/umbraculum-dev}"
OPENPLC_PROJECT_REPO="${OPENPLC_PROJECT_ROOT:-/path/to/openplc-brewery-project}"

input="$(cat)"
roots="$(printf '%s' "$input" | jq -r '.workspace_roots[]?')"

paths=()
add() {
  if [[ -d "$1" && -f "$1/.cursor-plugin/plugin.json" ]]; then
    paths+=("$1")
  fi
}

while IFS= read -r root; do
  [[ -z "$root" ]] && continue
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
    *)
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
