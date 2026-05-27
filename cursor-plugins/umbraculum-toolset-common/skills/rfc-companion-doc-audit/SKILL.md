---
name: rfc-companion-doc-audit
description: Bounded audit of whether accepted RFCs in an umbraculum-class repo have expected companion documentation on disk. Use when reviewing RFC compliance, before a rendering/notifications implementation PR, or when asked to score documentation completeness for RFC-0001 through RFC-0008.
---

# Skill: RFC companion documentation audit

Read-only check against the living matrix and required companion paths. Does not rewrite RFC commitment text.

## Inputs required (do not assume)

- `<REPO_ROOT>` — umbraculum-dev (or sibling) checkout with `docs/rfcs/README.md`.
- Optional `<RFC_NUMBERS>` — comma-separated list (e.g. `7,8`); default: scan P0 companions only.

## Output format (return exactly)

### Prerequisites

### Findings

### Stop conditions

## Bounds (hard)

- Max **3** commands (`test -f`, `python3 scripts/docs/check-rfc-companion-links.py`, optional `head` on audit doc).
- No loops/polling.
- No full RFC dumps — bounded one-line-per-gap summary.

## Prerequisites

- `<REPO_ROOT>/docs/design/rfc-companion-documentation-audit.md` exists.
- `<REPO_ROOT>/docs/rfcs/README.md` §3 exists.

## Commands

1. Read audit matrix header and verdict snapshot (first ~40 lines only).
2. Run: `cd <REPO_ROOT> && python3 scripts/docs/check-rfc-companion-links.py`
3. If `<RFC_NUMBERS>` given, grep audit doc for those RFC rows and report P0/P1 status in ≤8 lines.

## Stop conditions

- Stop after reporting OK/FAIL from script plus any extra RFC-specific gaps.
- If script missing, check manually: `canonical-document-rendering-surface.md`, `canonical-notifications-outbound-delivery-surface.md`, `rfc-companion-documentation-audit.md`.
