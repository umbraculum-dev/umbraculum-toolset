---
name: hardware-doc-consistency-check
description: Run `make check-connections` (which invokes `tools/check_connections_consistency.py`) to validate the hardware-doc SoT before regenerating electrician PDFs. Use after editing connections data or before any electrician-PDF rebuild.
---

# Hardware-doc consistency check

Use this skill to run the canonical SoT consistency checker that gates electrician-PDF regeneration. The checker validates internal consistency of the hardware connections data (BOM, mapping sheet, electrician-handout source) before the build artifacts are allowed to refresh.

This skill is **read-only** with respect to project files. It runs a Python validator that prints to stdout; it does not modify any data.

## Inputs required (do not assume)

- `<REPO_ROOT>` (absolute path to the PLC project root containing the `Makefile` and `tools/check_connections_consistency.py`)

## Output format (return exactly)

### Prerequisites

(brief — confirm `<REPO_ROOT>/Makefile` and `<REPO_ROOT>/tools/check_connections_consistency.py` exist)

### Commands

(the bounded list of commands that were run, with their exit codes)

### Stop conditions

(any condition that aborted the run, or `(none triggered)` if all commands succeeded)

### Result

```
CHECK-CONNECTIONS: OK | FAIL (N issues)
```

If `FAIL`: append up to 5 lines of representative diagnostics from the checker's stdout (one issue per line). Do NOT dump the full stdout.

## Bounds (hard)

- Max 5 commands total (typically 2: a precondition check + the `make check-connections` invocation).
- No loops; no polling; no electrician-PDF rebuild after this skill — that is a separate skill / human step.
- Bounded output: max 5 representative diagnostic lines if FAIL; no full stdout dump; no full CSV dump.

## Prerequisites

- `<REPO_ROOT>/Makefile` defines a `check-connections` target.
- `<REPO_ROOT>/tools/check_connections_consistency.py` is the Python checker invoked by that target.
- Python 3 is available in the host shell.

## Commands

1. `ls -la "<REPO_ROOT>/Makefile" "<REPO_ROOT>/tools/check_connections_consistency.py"` — confirm both files exist; report sizes/mtimes.
2. `cd "<REPO_ROOT>" && make check-connections` — run the checker. Capture exit code and stdout/stderr.
3. (Only if step 2 exited non-zero) `cd "<REPO_ROOT>" && python3 tools/check_connections_consistency.py 2>&1 | head -30` — re-run the checker directly to capture the same diagnostics (sanity check that the failure is reproducible, not a Make artifact).

## Stop conditions

- `<REPO_ROOT>/Makefile` is missing → stop and ask the developer to confirm the repo root.
- `<REPO_ROOT>/tools/check_connections_consistency.py` is missing → stop; the project layout has diverged from the canonical openplc/brewery shape this skill targets.
- The Make target does not exist (`make: *** No rule to make target 'check-connections'`) → stop; report.
- The checker's stdout exceeds the head -30 cap repeatedly → stop and ask the developer to inspect the issues directly (signal of structural disagreement, not a list of small fixes).

## What to do on FAIL

The skill itself does NOT attempt to fix the inconsistencies — that is intentional. Fixes typically span the BOM CSV, the mapping sheet, and the electrician handouts; reconciling them is a deliberate authoring step, not a subagent action. Report the diagnostics and let the developer (or a foreground assistant pass) decide which side to align.

## See also

- Rule `45-hardware-doc-naming-and-scope-tags.mdc` — the broader hardware-doc discipline this checker enforces parts of.
- The project's `Makefile` (canonical: regen electrician PDFs is gated by `check-connections`).
- Subagent `hardware-doc-checker` — the read-only delegation that wraps this skill.
