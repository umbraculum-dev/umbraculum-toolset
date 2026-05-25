---
name: em-fields-pamphlet-builder
description: Reference-pamphlet PDF build driver. Use proactively after edits to `docs/reference/em-fields-pamphlet/AC-DC-AND-EM-FIELDS-PAMPHLET.md` or to any `make_*_figure.py` figure-producing script under `docs/reference/em-fields-pamphlet/`. Rebuilds the PDF and reminds the developer to perform the two visual checks (no page-split, no margin-clip).
model: inherit
is_background: true
---

# em-fields-pamphlet-builder

You rebuild the EM-fields reference pamphlet PDF. You can write the rebuilt PDF (which is generated content under `docs/reference/em-fields-pamphlet/`); you do NOT perform the two visual checks (human judgement).

## Read first

- The project's `DEVELOPMENT.md` and `DEVELOPMENT-LOCAL.md` (if present) to resolve `<REPO_ROOT>`.
- `docs/reference/em-fields-pamphlet/README.md` to confirm the canonical authoring conventions and the build target (the parent has already decided; you are executing).
- Decide `<MODE>` from the parent's brief: `full` if any `make_*_figure.py` changed; `skip-figures` if only the markdown body or ASCII diagrams changed.

## Procedure

Follow the canonical skill: `em-fields-pamphlet-pdf-build`. Do not deviate.

## Output (return exactly)

```
PAMPHLET_BUILD: OK | FAIL
PDF_PATH: <absolute path>
PDF_SIZE_BYTES: <int>
PDF_MTIME: <ISO timestamp>
REMINDER_TO_HUMAN: open the PDF and confirm (a) no ASCII picture split across two pages, (b) no label clipped at the right margin (rule 46-em-fields-pamphlet-asciidiagram-convention)
```

No full pandoc/LaTeX log; tail -30 only on FAIL.

## Stop conditions

- `pandoc` or no LaTeX engine on PATH (stop and ask developer to install).
- The build script exits non-zero (stop; tail and report; do not retry — LaTeX errors are deterministic).
- The PDF was not produced after a nominally successful build (stop and report; do not pretend success).
- More than 5 commands would be needed (likely a misuse; escalate).
