---
name: generate-development-local
description: Use this when the user asks to set up, create, or bootstrap their per-developer `DEVELOPMENT-LOCAL.md` at repo root from the project-canonical `DEVELOPMENT.md` (and optional `DEVELOPMENT-LOCAL-OLLAMA.md` sibling). Refuse to overwrite an existing `DEVELOPMENT-LOCAL.md` without explicit confirmation.
---

# Skill: Generate DEVELOPMENT-LOCAL.md from DEVELOPMENT.md

Use this when the user explicitly asks for local context setup (e.g. "create my DEVELOPMENT-LOCAL.md", "bootstrap local context", "seed local config from DEVELOPMENT.md"). The `00-development-local-addendum-gate.mdc` rule shipped by this plugin routes here for that case.

The result is a per-developer file the developer may keep gitignored, prefilled with everything derivable from project-versioned sources, and explicitly flagged for the few values that must come from the developer.

This skill is **ecosystem-agnostic**: the canonical shape of `DEVELOPMENT-LOCAL.md` comes from the consuming domain plugin's `docs/templates/DEVELOPMENT-LOCAL*.md` template (a JS/TS template, a Python+OpenPLC template, etc.). The consuming plugin's `00-development-local-addendum-gate.mdc` (if it ships ecosystem-specific addenda on top of the common one) and its template are the source of truth for which placeholders matter most.

## Inputs required (do not assume)

- `<DEVELOPMENT_MD_PATH>` — repo-root `DEVELOPMENT.md` (project-canonical).
- Optional `<DEVELOPMENT_LOCAL_OLLAMA_MD_PATH>` — repo-root `DEVELOPMENT-LOCAL-OLLAMA.md`, only if present (project-versioned local-model-runtime addendum).
- `<PLUGIN_TEMPLATE_PATH>` — the consuming domain plugin's `docs/templates/DEVELOPMENT-LOCAL*.md` (canonical shape; typically resolves to `~/.cursor/plugins/local/<plugin-name>/docs/templates/DEVELOPMENT-LOCAL.md` or a `<...>.example.md` sibling specific to the ecosystem). If multiple domain plugins are installed and ship a template, ask the user which one matches the current project before proceeding.
- User-supplied values for each `<fill_me>` placeholder that cannot be unambiguously extracted from the inputs above.

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)

- Max **5** commands (the write counts as 1).
- No loops/polling.
- No speculative paths, container names, URLs, port numbers, or device/serial-port/coil/register addresses — every value must come from the inputs or from an explicit user answer.
- Do not invent or substitute values for unanswered `<fill_me>` placeholders; leave them as `<fill_me>` and list them in the summary.
- Do not overwrite an existing `DEVELOPMENT-LOCAL.md` without explicit user confirmation.

## Prerequisites

- `DEVELOPMENT.md` exists at repo root. If absent, STOP and ask the user to author it first; do not invent a `DEVELOPMENT-LOCAL.md` from generic plugin guidance alone.
- The plugin template at `<PLUGIN_TEMPLATE_PATH>` is readable. If not, STOP and report the missing/inaccessible path (the plugin may not be installed correctly — point user at `cursor-plugins/docs/WORKSPACE-PLUGIN-LOADING.md`).
- `DEVELOPMENT-LOCAL.md` does NOT already exist at repo root. If it does, STOP and ask the user whether to (a) leave it alone, (b) print a diff vs what this skill would generate, or (c) overwrite (only on explicit consent).

## Commands (templates)

1) **Read inputs.** Read `<DEVELOPMENT_MD_PATH>`. If `<DEVELOPMENT_LOCAL_OLLAMA_MD_PATH>` is present, read it too. Read `<PLUGIN_TEMPLATE_PATH>`.
2) **Extract derivable values.** For each `<fill_me>` placeholder in the template, attempt to fill it from explicit mentions in `DEVELOPMENT.md` (container/service names, ports, URLs, canonical paths, hardware/runtime endpoints) and `DEVELOPMENT-LOCAL-OLLAMA.md` (local model id, Ollama endpoint URL, `.local.md` agent variants in use). Do NOT guess — only fill what is explicitly stated.
3) **Ask the user for remaining values.** Present the still-unfilled `<fill_me>` placeholders as a short, structured list (one prompt round). Accept "skip" / "leave blank" answers — those slots stay as `<fill_me>` in the output for the developer to complete later.
4) **Confirm before writing.** Show the user the proposed final content (or a concise summary: filled-from-DEVELOPMENT.md / filled-from-OLLAMA / filled-from-user / left-as-fill_me) and ask for go-ahead.
5) **Write `DEVELOPMENT-LOCAL.md`** at repo root.

## Stop conditions

- `DEVELOPMENT.md` is absent at repo root.
- `<PLUGIN_TEMPLATE_PATH>` is missing or unreadable (plugin install may be broken — point user at `cursor-plugins/docs/WORKSPACE-PLUGIN-LOADING.md`).
- `DEVELOPMENT-LOCAL.md` already exists and the user has not granted explicit overwrite consent.
- More than a handful of `<fill_me>` slots remain unresolved after one user-prompt round (defer rather than badger — write what you have, leave the rest as `<fill_me>`, and report the gaps in the summary).
- The user declines the write at the confirmation step.

## Project-specific stop conditions (consult consuming plugin)

The consuming domain plugin's `00-development-local-addendum-gate.mdc` and its `docs/templates/DEVELOPMENT-LOCAL*.md` may surface ecosystem-specific values that justify additional stop conditions — e.g. a hardware-in-the-loop project may require a transport profile (`bench` | `field`) and a serial-port path before the write makes sense; a containerized-runtime project may require the container name. When such values are required by the template AND cannot be filled from the inputs OR the user's answers, leave them as `<fill_me>` and surface them clearly in the summary rather than blocking the write.
