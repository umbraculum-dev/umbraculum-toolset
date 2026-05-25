---
name: curl-exception-verification
description: Use this when a developer provides a URL that shows a PHP exception/error and you need to verify a fix.
---

# Skill: Verify browser exceptions via curl (container)

Use this when a developer provides a URL that shows a PHP exception/error and you need to verify a fix.

## Inputs required (do not assume)
- `<PHP_CONTAINER>`
- `<URLS>` (one or more URLs)
- Optional: `<EXCEPTION_STRING>` (if known / provided by the developer)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- No speculative container names or URLs.
- Keep output bounded (OK/FAIL summaries; no full HTML dumps).

## Prerequisites
- Curl must run inside the PHP container (do not assume host networking matches).

## Commands (templates)
1) Curl each URL from inside `<PHP_CONTAINER>` using a bounded request (example flags: `-sS -L --max-time <seconds>`).
2) Check early output for `Error:` and fatal markers; treat as **FAIL**.
3) If output is large, print only OK/FAIL and first matching line (or `head -n <N>`).

## Stop conditions
- `<PHP_CONTAINER>` is unknown/ambiguous.
- No URL(s) provided.
- The curl command is blocked by allowlist/approval and cannot proceed.
- Output is too large to safely print (switch to OK/FAIL-only reporting).
