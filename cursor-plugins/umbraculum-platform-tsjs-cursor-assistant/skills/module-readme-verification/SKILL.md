---
name: module-readme-verification
description: Run the project's module-README structural + link checker against affected READMEs and return a bounded OK/FAIL summary.
---

# Module README verification

Use this skill to confirm a module README under `apps/*/README.md`, `services/*/README.md`, or `packages/*/README.md` conforms to the project's `docs/DOCS-README-STANDARDS.md` (via the project's `scripts/docs/check-readmes.py` structural + link checker).

## Inputs required (do not assume)

- `<README_PATH>` (absolute path to the affected README, e.g. `/home/rf/dkprojects/rfapps/umbraculum-dev/packages/contracts/README.md`)
- `<REPO_ROOT>` (absolute path to the monorepo root)

## Output format (return exactly)

### Prerequisites

(what was inferred from inputs)

### Commands

(the bounded list of commands run, with exit codes)

### Stop conditions

(`(none triggered)` if all succeeded; otherwise the specific stop condition met)

### Result

```
README <relative-path>: OK | FAIL (N issues)
```

If `FAIL`: append up to 3 representative `<check-name>: <one-line-finding>` lines.

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling; no speculative paths.
- Bounded output: no full markdown dump; no full link enumeration; no full failure list (cap at 3 representative findings).

## Prerequisites

- `<README_PATH>` exists.
- `<REPO_ROOT>/scripts/docs/check-readmes.py` exists (the structural checker — published as part of the docs slice's CI gate).
- `python3` is available on PATH (the script is zero-dependency Python).

## Commands

1. `python3 <REPO_ROOT>/scripts/docs/check-readmes.py 2>&1 | grep -E "^(<relative-readme-path>|ERROR:|WARN:)" | head -20`
   - The script prints a per-README pass/fail summary; grep narrows to the affected README + structural-error lines; head caps the output.
2. (Optional, only if the script reports a link-resolution failure) `ls -la <REPO_ROOT>/<broken-link-target>` to confirm whether the linked file is genuinely missing or whether the link is malformed.

(Reserve any unused command slots for genuine follow-ups only; do not pad.)

## Stop conditions

- `<README_PATH>` is not under `apps/*/README.md`, `services/*/README.md`, or `packages/*/README.md` (the script does not check it; the rule does not apply).
- `<REPO_ROOT>/scripts/docs/check-readmes.py` is missing (the project has not landed the docs-slice CI gate). Fall back to manual audit-checklist read.
- The script's output exceeds the head-20 cap (signal that the failure is structural and needs a maintainer; do not paginate).
