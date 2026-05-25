---
name: openplc-runtime-upload
description: Bench-profile OpenPLC runtime upload — editor-compile, `prepare_openplc_runtime_upload.py`, web-UI upload, confirm Status:Running + start_modbus() port:502. Use when applying PLC source changes to the bench runtime.
---

# OpenPLC runtime upload (bench profile)

Use this skill to drive the bench-profile upload pipeline that moves PLC source changes through the editor compile → post-process transform → OpenPLC Runtime web UI. The field profile (CONTROLLINO MEGA Pure upload via the OpenPLC Editor directly) is a different procedure and is out of scope for this skill — see `docs/architecture/OPENPLC-EDITOR-TO-CONTROLLINO-DEPLOYMENT.md` in the consuming project.

## Inputs required (do not assume)

- `<REPO_ROOT>` (absolute path to the PLC project root, e.g. `/home/rf/dkprojects/arduino-and-plc/openplc/brewery/tanks-pump-priority-and-low-high-levels-sensors-alarms`)
- `<OPENPLC_TARGET>` (the editor compile target — e.g. `OpenPLC Simulator`)
- `<OPENPLC_RUNTIME_URL>` (the OpenPLC Runtime web UI URL — typically `http://127.0.0.1:8080`)

## Output format (return exactly)

### Prerequisites

(brief — confirm `<REPO_ROOT>` exists, the editor compile artifact path is `<REPO_ROOT>/build/<OPENPLC_TARGET>/src/program.st`, and `tools/prepare_openplc_runtime_upload.py` is present)

### Commands

(the bounded list of commands that were run, with their exit codes)

### Stop conditions

(any condition that aborted the run, or `(none triggered)` if all commands succeeded)

### Result

```
EDITOR_COMPILE: OK | FAIL
RUNTIME_UPLOAD_ARTIFACT: <path>
RUNTIME_STATUS (developer to confirm in UI): expected "Running" + "Issued start_modbus() command to start on port: 502"
```

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling.
- No speculative file paths/container names/URLs/coil addresses — every path comes from the inputs above or from on-disk inspection.
- Bounded output: no full ST dump; no full `program.runtime-upload.st` content.

## Prerequisites

- `<REPO_ROOT>` is a valid PLC project root (contains `pous/`, `project.json`, `tools/prepare_openplc_runtime_upload.py`).
- The OpenPLC Editor has already produced `<REPO_ROOT>/build/<OPENPLC_TARGET>/src/program.st`. This skill does NOT drive the editor compile step (the editor is a GUI; ask the developer to compile if the file is absent or stale).
- The OpenPLC Runtime is reachable at `<OPENPLC_RUNTIME_URL>`. This skill does NOT drive the web-UI upload (a human still uploads the file via the Programs page).

## Commands

1. `ls -la "<REPO_ROOT>/build/<OPENPLC_TARGET>/src/program.st"` — confirm the editor-compile output exists and check its mtime (must be newer than the most recent `pous/` change).
2. `cd "<REPO_ROOT>" && python3 tools/prepare_openplc_runtime_upload.py` — run the post-process transform.
3. `ls -la "<REPO_ROOT>/build/<OPENPLC_TARGET>/src/program.runtime-upload.st"` — confirm the upload artifact was produced; report its size and mtime.
4. (Report-only step) Tell the developer: open `<OPENPLC_RUNTIME_URL>`, navigate to `Programs`, upload `<REPO_ROOT>/build/<OPENPLC_TARGET>/src/program.runtime-upload.st`, then start the runtime.
5. (Report-only step) Tell the developer to confirm the OpenPLC Runtime dashboard shows: `Status: Running` AND `Issued start_modbus() command to start on port: 502`.

(Steps 4 and 5 are human-action reminders — they do not consume a shell command slot, so this skill keeps headroom for one diagnostic command if step 1 or 2 surfaces an unexpected condition.)

## Stop conditions

- `<REPO_ROOT>/build/<OPENPLC_TARGET>/src/program.st` is missing → tell the developer to run the editor compile first; do not invent a fallback.
- The `program.st` mtime is OLDER than the most recent `pous/` change → tell the developer the editor compile is stale; do not transform stale source.
- `tools/prepare_openplc_runtime_upload.py` exits non-zero → report the last 20 lines of its output and stop; do not retry.
- The upload artifact is empty or missing after step 2 → stop; do not retry.
- `<OPENPLC_TARGET>` is unknown / `build/<OPENPLC_TARGET>/` does not exist → stop and ask the developer to confirm the editor's active target.

## See also

- Rule `08-pi-modbus-contract-and-runtime-upload.mdc` — the contract this skill operationalizes.
- Rule `06-bench-vs-field-profile.mdc` — why this skill is bench-only.
- Subagent `openplc-runtime-uploader` — the read-mostly delegation that wraps this skill.
