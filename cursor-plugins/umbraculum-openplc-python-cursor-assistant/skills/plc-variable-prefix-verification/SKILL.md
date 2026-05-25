---
name: plc-variable-prefix-verification
description: Scan PLC source (`pous/**/*.st`, `pous/**/*.ld`, `project.json`) for variable names that violate the prefix convention (`I_/Q_/M_/AI_/AI_RAW_/CFG_/SVC_/P_/PI_`). Bounded one-line-per-violation summary. Use when reviewing a PLC source change or auditing a section.
---

# PLC variable prefix verification

Use this skill to scan PLC source files for variable identifiers that violate the canonical prefix convention (see rule `04-plc-variable-naming-prefix-convention.mdc`). It is a **read-only** static scan; it does NOT propose renames.

## Inputs required (do not assume)

- `<REPO_ROOT>` (absolute path to the PLC project root)
- `<SCOPE>` (one of `pous/programs/`, `pous/function-blocks/`, `pous/functions/`, `project.json`, or `all` for the union of the four) — restricts the scan footprint.

## Output format (return exactly)

### Prerequisites

(brief — confirm `<REPO_ROOT>/pous/` exists; confirm `ripgrep` is available)

### Commands

(the bounded list of commands that were run, with their exit codes)

### Stop conditions

(any condition that aborted the run, or `(none triggered)` if all commands succeeded)

### Result

```
PREFIX_SCAN: OK (no violations) | FAIL (N violations in M files)
```

If FAIL: append up to **10** representative one-line-per-violation entries:

```
<relative-path>:<line> <offending-identifier> (expected prefix: <I_|Q_|M_|AI_|AI_RAW_|CFG_|SVC_|P_|PI_>)
```

If there are more than 10, append a trailing line: `(+N more — re-run with narrower <SCOPE> to enumerate)`.

## Bounds (hard)

- Max 5 commands total (typically 2-3 `rg` invocations).
- No loops; no per-file iteration in the subagent context.
- No automatic renames; no edits; no `sed` / `awk` rewrites.
- Bounded output: max 10 violation lines; do NOT dump the full ripgrep output.

## Prerequisites

- `<REPO_ROOT>/pous/` exists (or the chosen `<SCOPE>` is `project.json`).
- `ripgrep` (`rg`) is installed.

## Commands

1. `cd "<REPO_ROOT>" && ls -la pous/` (and `ls -la project.json` if in scope) — confirm the scan targets exist.
2. Run the prefix-violation scan via ripgrep with a regex that matches plausible PLC identifier shapes NOT prefixed by the canonical set. Bounded example for `<SCOPE>=pous/function-blocks/`:

   ```bash
   rg -n -e '\b(?![IQM]_|AI_|AI_RAW_|CFG_|SVC_|P_|PI_|__[QIM]X|__MW)[A-Z][A-Za-z0-9_]*\b' \
     -t st pous/function-blocks/ \
     | head -50
   ```

   Adjust the include path per `<SCOPE>`. The `__[QIM]X` / `__MW` carve-out excludes OpenPLC-generated glue names (toolchain artifacts; not authored names — see rule `04`).

3. (Optional, if step 2 finds candidates that may be IEC 61131-3 reserved words like `TRUE`, `FALSE`, `TON`, `IF`, `THEN`, `END_IF`, `VAR`, `END_VAR`) Filter out the reserved-word noise via a second `rg` pass with a `-v` exclusion list — bounded to a single command.

## Stop conditions

- `<REPO_ROOT>/pous/` does not exist AND `<SCOPE>` is not `project.json` → stop and report.
- ripgrep not installed → stop and ask developer to install (`apt install ripgrep`).
- The regex produces > 200 matches → the scan is too noisy in the current scope; stop, report the count, and ask the developer to narrow `<SCOPE>`.
- Any candidate "violation" turns out to be an IEC 61131-3 reserved word or a documented carve-out (see Step 3) → exclude it; do not include it in the violation list.

## What this skill does NOT do

- It does NOT propose new names. Suggesting renames is a deliberate authoring step (PLC variables show up in the editor's variable list, on rung comments, and in the `PI_*` Modbus map; an automated rename would silently break references in non-source places).
- It does NOT scan the Pi-sidecar's Python code. The `PI_*` Python identifiers there mirror the contract; a sidecar-side audit is a different skill.

## See also

- Rule `04-plc-variable-naming-prefix-convention.mdc` — the convention this scan enforces.
- Rule `08-pi-modbus-contract-and-runtime-upload.mdc` — `PI_*` names are a contract surface; renames cascade.
- Subagent `plc-vars-prefix-verifier` — the read-only delegation that wraps this skill.
