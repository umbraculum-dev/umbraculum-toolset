# Bugbot review rules — OpenPLC / Python sidecar

Feature work merges via PRs to **`main`**. Suggested flow: optional local `/review-bugbot` before push; on PR comment `bugbot run` for cloud review. Runtime verification remains Makefile targets and sidecar pytest.

**Policy:** Report findings only. Do not suggest Autofix or auto-commits.

---

## PI_* Modbus contract

- Flag new external-facing coils/registers that are not `PI_*` prefixed or not documented in the Modbus map.
- Flag sidecar or tools reading internal PLC variables when `PI_*` mailbox should be the stable contract.
- Flag changes to `PI_*` addresses without updating map JSON and hardware-doc cross-references.

## Variable naming prefixes

- Flag authored variables in `pous/**` or `project.json` missing canonical prefixes (`I_/Q_/M_/AI_/AI_RAW_/CFG_/SVC_/P_/PI_` per rule `04-plc-variable-naming-prefix-convention.mdc`).
- Do not flag OpenPLC-generated glue names (`__QX100_0`) as violations.

## Bench vs field profile

- Flag bench-only assumptions (Modbus TCP localhost) in code paths documented for field RTU without profile guards.
- Flag field serial settings hardcoded without `DEVELOPMENT-LOCAL.md` placeholders.

## FastAPI / sidecar layering

- Flag JSON routes emitting bodies without `response_model` or equivalent schema discipline.
- Flag business logic in route handlers that belongs in `app/domain/` or `app/services/`.
- Flag edits treating `build/` OpenPLC artifacts as authoritative source (source of truth is `pous/**` + editor compile).

## SOLID and project structure

- Flag new cross-layer imports that violate sidecar layering (`app/main.py`, `app/bridge/`, `app/domain/`, etc.).
- Flag `pyproject.toml` version drift vs integrated release baseline when release docs are touched.

## Hardware documentation

- Flag new hardware docs missing scope tags (`[ALARM]`, `[COOLING]`, `[HEATING]`, etc.) or wrong filename suffix (`-CONTRACT`, `-SPEC`, `-DIRECTION`, etc.).
- Flag rewrites of historical backup docs marked do-not-edit.

## Pamphlet / ASCII diagrams

- Flag new EM-fields diagrams using plain markdown fences instead of `asciidiagram` `tcolorbox` `{=latex}` blocks.
- Flag font-size increases to fix width overflow instead of shrinking the diagram.

## Tests

- Flag sidecar behavior changes without updates under `pi-sidecar/**/test*` or documented Makefile test targets when applicable.

## Out of scope for this review

Do not treat absence of runtime proof as a blocking bug:

- Live Modbus bench reads
- OpenPLC Runtime web UI upload
- Full pamphlet PDF visual inspection
- Field cabinet hardware-in-the-loop

Flag only issues visible from the diff and static analysis.
