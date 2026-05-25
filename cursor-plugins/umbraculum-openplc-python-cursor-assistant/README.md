# umbraculum-openplc-python-cursor-assistant

Cursor assistant plugin for the umbraculum-toolset **industrial-automation sister-repo** at `/path/to/openplc-brewery-project/` (and any future project that adopts the same OpenPLC + Python + FastAPI + Modbus + hardware-doc pattern).

Distinct from the other two domain umbraculum-toolset plugins:

| Plugin | Target |
|---|---|
| `umbraculum-node-react-cursor-assistant` | generic TS/JS/React projects |
| `umbraculum-platform-tsjs-cursor-assistant` | umbraculum-platform projects (umbraculum-dev) — TS/JS half of the platform |
| **`umbraculum-openplc-python-cursor-assistant`** (this plugin) | the OpenPLC/brewery industrial-automation sister-repo |

This plugin requires the companion `umbraculum-toolset-common` plugin for the language-agnostic meta-framework rules (DEVELOPMENT-LOCAL gate, Skill Contract, commit-message ticket-prefix discipline) and the `generate-development-local` skill. Outside that shared layer it is independent of the two TS/JS plugins (`umbraculum-node-react-cursor-assistant`, `umbraculum-platform-tsjs-cursor-assistant`) — the two technology stacks (TS/JS vs Python+PLC) are sufficiently distinct that the rule overlap is small and the residual ecosystem-specific rules (Subagent Contract additions, host-no-rm PLC-source caveats, etc.) stay here. See `/path/to/umbraculum-toolset/cursor-plugins/docs/PLUGIN-ROADMAP.md` § 2 for the rationale.

## When to install

- **Install in**: `/path/to/openplc-brewery-project/` (the canonical motivating project) and any future project that uses the same five surfaces (OpenPLC IEC-61131-3 ladder + ST POUs; `PI_*` Modbus mailbox contract; FastAPI + Jinja + SQLite Pi-sidecar; `[ALARM]/[COOLING]/[HEATING]` hardware-doc taxonomy; `pandoc + xelatex` ASCII-diagram pamphlets).
- **Do not install in**: pure TS/JS projects, pure Python web apps without PLC integration, the Magento codebase, or umbraculum-platform projects (use the appropriate companion plugin instead).

## Contents

### Rules (`rules/`)

**Domain-specific (9 rules)** — encode the conventions inferred from the openplc/brewery `DEVELOPMENT.md` and surrounding docs:

- `02-openplc-project-structure.mdc` — the `pous/programs/`, `pous/function-blocks/`, `pous/functions/`, `build/`, `project.json` layout; source-vs-build discipline; `main.ld` is editor-source, not runtime-uploaded; backups directory is not authoritative
- `03-openplc-function-vs-function-block.mdc` — `Function` vs `Function Block` POU kinds are not interchangeable; serialized headers differ (`FUNCTION ... END_FUNCTION` vs `FUNCTION_BLOCK ... END_FUNCTION_BLOCK`); recovery is delete-and-reinsert from the correct category, not metadata salvage
- `04-plc-variable-naming-prefix-convention.mdc` — the canonical `I_/Q_/M_/AI_/AI_RAW_/CFG_/SVC_/P_/PI_` prefixes; OpenPLC-generated glue names (`__QX100_0`) are toolchain artifacts, not authored project names
- `06-bench-vs-field-profile.mdc` — the two transport profiles (Modbus TCP on the Linux/OpenPLC Runtime bench vs Modbus RTU over USB-Serial on the CONTROLLINO MEGA Pure field cabinet); when to use each; what each is *not* proof of
- `08-pi-modbus-contract-and-runtime-upload.mdc` — `PI_*` coils/holding-registers are the stable external contract; internal PLC vars are implementation detail; the `tools/prepare_openplc_runtime_upload.py` post-process step transforms `build/OpenPLC Simulator/src/program.st` into `program.runtime-upload.st`; `PI_SVC_*` bench hooks are not authored controller logic
- `25-pi-sidecar-fastapi-jinja-sqlite-conventions.mdc` — FastAPI + Jinja + SQLite layering (`app/main.py`, `app/config.py`, `app/domain/`, `app/bridge/`, `app/history/`, `app/web/`, `app/services/`, `app/supervision/`, `app/fermentation_program/`); the vendor-integration adapter pattern; `pyproject.toml` as canonical sidecar-version source; `127.0.0.1`-only listener + mandatory login + SSH-tunnel remote access
- `45-hardware-doc-naming-and-scope-tags.mdc` — `-CONTRACT.md` / `-SPEC.md` / `-DIRECTION.md` / `-PLAN.md` / `-CHECKLIST.md` filename suffixes; `[ALARM]/[COOLING]/[HEATING]/[THERMAL]` scope tags in BOM CSV `project_scope`, rung-comment prefixes, and variable documentation prefixes; do-not-rewrite-historical-backups
- `46-em-fields-pamphlet-asciidiagram-convention.mdc` — `pandoc + xelatex/tectonic` A5 builds; every ASCII diagram MUST be wrapped in the `asciidiagram` `tcolorbox` (raw LaTeX inside a `{=latex}` block); plain ```` ``` ```` fences fail (font-size + page-break); `verbatimfontsize` is 6.0 pt / 7.2 pt; if a new diagram is too wide, shrink the diagram, not raise the font
- `47-integrated-release-versioning-baseline.mdc` — `integrated_release_tag` + `PLC version` + `sidecar version` + `PI/Modbus contract version` + `API version` must move together; `pyproject.toml` is the canonical sidecar version source; documents carry a `Document Metadata` header repeating the active baseline

**Meta-framework rules carried here (9 rules)** — these carry substantive ecosystem-specific additions (PLC source caveats, Modbus-write anti-patterns, ladder-graph merge notes, binary-file edit notes, etc.) and intentionally stay in this plugin:

- `00-workflow.mdc`, `05-host-no-rm.mdc`, `13-rule-skill-authoring-gate.mdc`, `14-subagent-contract.mdc`, `15-subagent-delegation-guardrails.mdc`, `42-merge-conflicts-no-behavior-change.mdc`, `96-blocked-edit-tee-fallback.mdc`, `97-plans-must-include-canonical-absolute-paths.mdc`, `98-python-dir-listing-over-glob.mdc`

**Meta-framework rules hoisted to the common plugin (3 rules, plus 1 skill)** — install [`umbraculum-toolset-common`](../umbraculum-toolset-common/README.md) alongside this plugin to get:

- `00-development-local-addendum-gate.mdc`, `12-skill-contract.mdc`, `41-commit-message-ticket-prefix.mdc`
- `skills/generate-development-local/`

The `cursor-plugins/scripts/install-local.sh` installer installs all four umbraculum-toolset plugins together.

### Skills (`skills/`) — 6 skills, one per subagent

- `openplc-runtime-upload/SKILL.md` — bounded runbook for editor-compile → `prepare_openplc_runtime_upload.py` → OpenPLC Runtime web UI upload → confirm `Running` + `start_modbus() ... port: 502`
- `pi-modbus-mailbox-debug/SKILL.md` — bounded runbook for reading a `PI_*` coil/holding-register from outside the sidecar (raw `pymodbus`) to triage "the sidecar shows X but the PLC shows Y" mismatches
- `pi-sidecar-local-stack-bringup/SKILL.md` — bounded runbook for `docker compose up` on the Pi-sidecar with the mock bridge, then switching to the real OpenPLC bridge via `PI_SIDECAR_OPENPLC_*` env vars
- `hardware-doc-consistency-check/SKILL.md` — bounded runbook for `make check-connections` + the `tools/check_connections_consistency.py` SoT checker; what to do when it fails
- `em-fields-pamphlet-pdf-build/SKILL.md` — bounded runbook for `make reference-pdfs` (and the diagram-only `--skip-figures` variant); the two visual checks (no page-split, no margin-clip) required after every pamphlet edit
- `plc-variable-prefix-verification/SKILL.md` — bounded static-scan runbook (ripgrep) for variable identifiers in `pous/**` and `project.json` that violate the `I_/Q_/M_/AI_/AI_RAW_/CFG_/SVC_/P_/PI_` prefix convention (rule `04`); max 10 violation lines per run

### Agents (`agents/`) — 5 subagents

- `openplc-runtime-uploader.md` — wraps `openplc-runtime-upload` skill; readonly until the actual web-UI upload step (which is a human action anyway)
- `pi-modbus-mailbox-inspector.md` — wraps `pi-modbus-mailbox-debug`; readonly; bounded OK/FAIL summary
- `hardware-doc-checker.md` — wraps `hardware-doc-consistency-check`; readonly; bounded OK/FAIL summary
- `em-fields-pamphlet-builder.md` — wraps `em-fields-pamphlet-pdf-build`; can write the rebuilt PDF; reminds operator to do the two visual checks
- `plc-vars-prefix-verifier.md` — wraps `plc-variable-prefix-verification`; readonly; scans for prefix-convention violations; max 10 one-line-per-violation entries; does NOT propose renames

### Templates (`docs/templates/`)

- `DEVELOPMENT-LOCAL.openplc.example.md` — project-owned local-context template; encodes the inputs the skills/agents need (canonical repo root, OpenPLC Runtime URL, Pi-sidecar container name, serial port for RTU profile, etc.). Read by the common plugin's `00-development-local-addendum-gate.mdc` rule.

## Witness rule

This plugin **does not yet have a declared witness rule** in the umbraculum-toolset's witness-rule registry (the registry table in [`cursor-plugins/README.md`](../README.md#todays-witness-rule-registry-this-toolset) currently lists this plugin's row as `_(not yet declared)_`). Downstream `AGENTS.md` authors in the OpenPLC + Python sister-repo who want to wire up an apparatus self-check for this plugin should:

1. Pick an `alwaysApply: true` rule from this plugin's `rules/` directory whose content is generic enough that always-loading it is not a context tax (e.g. `00-workflow.mdc`, `14-subagent-contract.mdc`, or `15-subagent-delegation-guardrails.mdc`). This makes the witness an **unconditional** witness, verifiable by rule-list introspection in any conversation.
2. Document the choice in the downstream `AGENTS.md`'s witness-rule table.
3. Open a PR against this repo to add the choice to the toolset-level registry so plugin authors are notified if the rule is ever renamed or recategorized — the witness-rule contract is part of the plugin's public surface area.

See the toolset-level [`cursor-plugins/README.md` § "Witness-rule contract for downstream `AGENTS.md` consumers"](../README.md#witness-rule-contract-for-downstream-agentsmd-consumers) for the full contract, the two-category model (unconditional vs conditional), and the anti-pattern warning against "fixing" a failing witness check by flipping `alwaysApply: true` on a rule whose content is genuinely file-scoped.

## Provenance

The 9 domain rules were inferred from a focused exploration of `/path/to/openplc-brewery-project/` on 2026-05-18, primarily from:

- `DEVELOPMENT.md` (the dense convention summary — sections 0-8)
- `docs/runtime/OPENPLC-RUNTIME-UPLOAD-AND-PI-MODBUS-INTERFACE.md` (the bench-vs-field profile distinction and the `PI_*` mailbox contract)
- `pi-sidecar/README.md` (FastAPI/Jinja/SQLite layering, versioning baseline, SSH-tunnel remote-access pattern)
- `docs/reference/em-fields-pamphlet/README.md` (the ASCII-diagram authoring convention)
- `project.json` (the OpenPLC editor debug-variable mailbox + reload behavior)
- `Makefile`, `tools/check_connections_consistency.py`, `tools/prepare_openplc_runtime_upload.py` (the build/check toolchain)

If those upstream docs evolve, the rules SHOULD be re-derived rather than blindly maintained.

## Version history

- **0.0.1** (2026-05-25) — public baseline after the repository history reset. Includes the current OpenPLC + Python + Modbus + hardware-doc rules, skills, subagents, and local-context template.

## See also

- `/path/to/umbraculum-toolset/cursor-plugins/README.md` — multi-plugin overview + install + pairing rationale.
- `/path/to/umbraculum-toolset/cursor-plugins/docs/PLUGIN-ROADMAP.md` — future shared-meta plugin + private-vs-marketplace transition notes.
- `/path/to/openplc-brewery-project/DEVELOPMENT.md` — the upstream convention document this plugin codifies for Cursor.
