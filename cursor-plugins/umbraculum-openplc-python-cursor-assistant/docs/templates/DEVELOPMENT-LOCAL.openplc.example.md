# DEVELOPMENT-LOCAL.md (optional per-developer project context — openplc/brewery shape)

This file is per-developer (typically gitignored) and is **not** synced by the plugin.

If this file exists at the repo root of an OpenPLC + Python + FastAPI + Modbus project, the `umbraculum-openplc-python-cursor-assistant` plugin (via the `umbraculum-toolset-common` companion plugin's gate rule `00-development-local-addendum-gate.mdc`) reads it early and treats it as project-specific context. If it does not exist, the assistant proceeds normally and asks for missing values only when a task requires them.

You can either hand-write this file using the template below, or ask the agent to generate it for you from your project's `DEVELOPMENT.md` (e.g. "create my DEVELOPMENT-LOCAL.md"). The agent will then invoke the `generate-development-local` skill — it reads `DEVELOPMENT.md`, reads `DEVELOPMENT-LOCAL-OLLAMA.md` if present, fills in everything it can derive, and asks you for the remaining `<fill_me>` values (typically bench-vs-field profile, serial-port path, OpenPLC Runtime URL, Pi-sidecar host).

Sibling, project-versioned addendum: if your project also commits a `DEVELOPMENT-LOCAL-OLLAMA.md` at repo root (the local-model-runtime addendum — Ollama model id, endpoint URL, `.local.md` agent/subagent variants in use), the assistant reads it alongside this file at session start. That file is project-versioned (lives in the project's main repo); this file is per-developer.

Keep this file short and high-signal. Put reusable procedures in plugin **Skills** instead of duplicating long runbooks here.

---

## Project summary

- Project type: `openplc-iec61131-3 + python-fastapi-sidecar`
- Main stack: `<fill_me — e.g. OpenPLC v3 + Python 3.11 + FastAPI + Jinja + SQLite + pymodbus + CONTROLLINO MEGA Pure>`
- Integrated release tag: `<fill_me — e.g. 2.0.1-dev>`
- Contract version: `<fill_me — e.g. v2>`
- Important docs:
  - `DEVELOPMENT.md` (the dense convention summary)
  - `docs/plc-project/OPENPLC-PROJECT-STRUCTURE-SPEC.md`
  - `docs/runtime/OPENPLC-RUNTIME-UPLOAD-AND-PI-MODBUS-INTERFACE.md`
  - `docs/architecture/PRODUCTION-ARCHITECTURE-PLC-NATIVE-VESSEL-CONTROL-DIRECTION.md`
  - `pi-sidecar/README.md`
  - `pi-sidecar/openplc-modbus-map.example.json` (the canonical `PI_*` map)

## Canonical locations (examples — replace with your machine's paths)

- Canonical repo root: `/path/to/openplc-brewery-project`
- Cursor worktree root (if you use a worktree): `/path/to/cursor-worktree`
- OpenPLC compile target: `OpenPLC Simulator` (bench profile) or `<your-CONTROLLINO-target>` (field profile)
- Editor compile artifact: `<repo-root>/build/<target>/src/program.st`
- Upload artifact: `<repo-root>/build/<target>/src/program.runtime-upload.st`

## Transport profile (pick one as the default for this checkout)

- Default profile: `bench` | `field` (see rule `06-bench-vs-field-profile.mdc`)

### If `bench` (Modbus TCP):

- OpenPLC Runtime web UI: `<fill_me — e.g. http://127.0.0.1:8080>`
- Modbus host (for `pi-modbus-mailbox-debug` skill): `<fill_me — e.g. 127.0.0.1>` (or `host.docker.internal` from inside the sidecar container)
- Modbus port: `502`
- Modbus unit id: `1`

### If `field` (Modbus RTU over USB-Serial):

- Serial port: `<fill_me — e.g. /dev/ttyACM0>`
- Baudrate: `115200`
- Modbus unit id: `1`
- Field cabinet hostname (if SSH-accessible): `<fill_me — e.g. brewery-sidecar.local>`

## Pi-sidecar (Docker Compose) defaults

- Sidecar working directory: `<repo-root>/pi-sidecar/`
- Web UI URL (localhost): `http://127.0.0.1:8000` (loopback only — by design)
- Default bridge mode: `mock` (override via `PI_SIDECAR_PLC_BRIDGE=openplc` for the real OpenPLC bridge; see `pi-sidecar-local-stack-bringup` skill)
- SQLite history bind mount: `<repo-root>/pi-sidecar/pi-sidecar-data/` — DO NOT delete; treat as state (see rule `05-host-no-rm.mdc`)
- Remote-access pattern: SSH local port forward — `ssh -N -L 8088:127.0.0.1:8000 <pi-host>` (do NOT bind to `0.0.0.0`; do NOT add TLS termination without explicit authorization)

## Known slow commands / expected timeouts

- `python3 docs/reference/em-fields-pamphlet/build_em_fields_pamphlet.py` (full): `<fill_me — typically 30-120 s depending on figure count>`
- `make reference-pdfs`: equivalent to the above (full).
- `python3 docs/reference/em-fields-pamphlet/build_em_fields_pamphlet.py --skip-figures`: `<fill_me — typically 10-30 s>`
- `make electrician-pdfs`: `<fill_me>`
- `pytest pi-sidecar/`: `<fill_me — full suite duration>`

## Commands forbidden in this project (host-side)

- `rm -rf pous/` — would destroy the PLC source of truth (rule `05-host-no-rm.mdc`).
- `rm -rf backups/` — would destroy dated snapshots (rule `02-openplc-project-structure.mdc`).
- `rm -rf pi-sidecar/pi-sidecar-data/` — would destroy SQLite alarm/bypass history.
- `rm -rf build/` — only do this if the developer explicitly requests a cold rebuild; the editor compile step will recreate, but you'll lose the prepared upload artifact too.

## Protected branches / Git conventions

- Protected branches: `<fill_me — e.g. main, master, release/*>`
- Default PR base branch: `<fill_me>`
- Commit message convention: `<fill_me — e.g. branch-name prefix with Jira token per the umbraculum-toolset-common plugin's 41-commit-message-ticket-prefix.mdc rule>`

## Useful plugin Skills (this plugin)

- `openplc-runtime-upload` — bench-profile editor-compile → upload artifact → web-UI upload
- `pi-modbus-mailbox-debug` — raw `pymodbus` read of a single `PI_*` coil/holding-register
- `pi-sidecar-local-stack-bringup` — `docker compose up` for the sidecar (mock or real-OpenPLC mode)
- `hardware-doc-consistency-check` — `make check-connections` (BOM + mapping sheet + electrician-handout consistency)
- `em-fields-pamphlet-pdf-build` — `make reference-pdfs` (full or `--skip-figures`)
- `plc-variable-prefix-verification` — static scan for `pous/**` variables that violate the prefix convention

## Useful plugin Agents (this plugin)

- `openplc-runtime-uploader` — wraps the upload skill
- `pi-modbus-mailbox-inspector` — wraps the Modbus debug skill; read-only
- `hardware-doc-checker` — wraps the consistency check; read-only
- `em-fields-pamphlet-builder` — wraps the pamphlet build; can write the PDF
- `plc-vars-prefix-verifier` — wraps the prefix scan; read-only; max 10 violation lines

## Local-model variants (optional — only if `DEVELOPMENT-LOCAL-OLLAMA.md` exists)

If this project has set up Ollama-backed local variants of the subagents, list them here so the parent agent can prefer the local variant for bounded tasks:

- `<fill_me — e.g. pi-modbus-mailbox-inspector.local.md uses llama3.1:8b for read-only PI_* reads>`

## Project notes

- `<fill_me — anything else a parent agent should know about this checkout: maintainer on-call, hardware in-bench-or-in-cabinet, current debug focus, recent freeze rationale>`
