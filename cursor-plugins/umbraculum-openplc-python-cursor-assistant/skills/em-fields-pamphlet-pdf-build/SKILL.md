---
name: em-fields-pamphlet-pdf-build
description: Rebuild the EM-fields reference pamphlet PDF via `make reference-pdfs` (or the diagram-only `--skip-figures` variant). Use after editing the pamphlet markdown or its diagrams; reminds about the two visual checks (no page-split, no margin-clip).
---

# EM-fields pamphlet PDF build

Use this skill to rebuild `docs/reference/em-fields-pamphlet/AC-DC-AND-EM-FIELDS-PAMPHLET.pdf` after editing the pamphlet markdown or its ASCII diagrams. The skill performs the build; the developer (or a follow-up subagent step) MUST perform the two visual checks afterward.

## Inputs required (do not assume)

- `<REPO_ROOT>` (absolute path to the PLC project root containing the `Makefile` and `docs/reference/em-fields-pamphlet/`)
- `<MODE>` (`full` or `skip-figures`) — picks whether to regenerate Matplotlib figures.
  - `full`: regenerate all `make_*_figure.py` outputs AND the PDF. Use after editing any figure-producing Python script.
  - `skip-figures`: regenerate only the PDF from existing images. Use when only the markdown body or ASCII diagrams changed.

## Output format (return exactly)

### Prerequisites

(brief — confirm `<REPO_ROOT>/Makefile` defines `reference-pdfs` and `docs/reference/em-fields-pamphlet/build_em_fields_pamphlet.py` exists; confirm `pandoc` and `xelatex` or `tectonic` are on PATH)

### Commands

(the bounded list of commands that were run, with their exit codes)

### Stop conditions

(any condition that aborted the run, or `(none triggered)` if all commands succeeded)

### Result

```
PAMPHLET_BUILD: OK | FAIL
PDF_PATH: <REPO_ROOT>/docs/reference/em-fields-pamphlet/AC-DC-AND-EM-FIELDS-PAMPHLET.pdf
PDF_SIZE_BYTES: <int>
PDF_MTIME: <ISO timestamp>
REMINDER_TO_HUMAN: open the PDF and confirm (a) no ASCII picture split across two pages, (b) no label clipped at the right margin (rule 46-em-fields-pamphlet-asciidiagram-convention)
```

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling.
- The skill does NOT perform the two visual checks. They are human-judgement steps; the skill reminds the operator.
- Bounded output: no full pandoc log dump (tail -30 only on FAIL); no full LaTeX log.

## Prerequisites

- `<REPO_ROOT>/Makefile` defines `reference-pdfs`.
- `<REPO_ROOT>/docs/reference/em-fields-pamphlet/build_em_fields_pamphlet.py` exists.
- One of `xelatex` / `tectonic` is on PATH (the build script picks one).
- `pandoc` is on PATH.
- Python 3 is available.

## Commands

1. `which pandoc && (which xelatex || which tectonic)` — confirm the LaTeX toolchain is available; report which engine is on PATH.
2. For `<MODE>=full`:
   ```bash
   cd "<REPO_ROOT>" && make reference-pdfs
   ```
   For `<MODE>=skip-figures`:
   ```bash
   cd "<REPO_ROOT>" && python3 docs/reference/em-fields-pamphlet/build_em_fields_pamphlet.py --skip-figures
   ```
3. `ls -la "<REPO_ROOT>/docs/reference/em-fields-pamphlet/AC-DC-AND-EM-FIELDS-PAMPHLET.pdf"` — confirm the PDF exists; report size and mtime.

## Stop conditions

- `pandoc` or no LaTeX engine on PATH → stop and ask the developer to install (`apt install pandoc texlive-xetex` or install Tectonic).
- The build script exits non-zero → tail the last 30 lines of stderr/stdout and stop; do not retry (LaTeX errors are deterministic).
- The PDF was not produced (missing or mtime older than the build attempt) → stop and report; do not silently succeed.
- A FAIL in `<MODE>=full` that hints at a Matplotlib figure error → suggest retrying with `<MODE>=skip-figures` to isolate whether the failure is in the figures or in the pamphlet body.

## What this skill does NOT do

- The two visual checks (no page-split, no margin-clip) are explicitly **not** automated. The pamphlet's font-size sweet spot (6.0 pt / 7.2 pt) and the page-fit constraint are deliberately human-evaluated — see rule `46-em-fields-pamphlet-asciidiagram-convention.mdc`. If the operator wants a programmatic check, the right next step is to add a separate verification script in `tools/` — not to bolt it onto this skill.

## See also

- Rule `46-em-fields-pamphlet-asciidiagram-convention.mdc` — the authoring rules this build operationalizes.
- `docs/reference/em-fields-pamphlet/README.md` (in the consuming project) — the canonical authoring conventions reference.
- Subagent `em-fields-pamphlet-builder` — the delegation that wraps this skill.
