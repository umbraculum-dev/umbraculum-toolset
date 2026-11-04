---
name: curl-exception-verification
description: Use when a developer provides a URL that shows a browser/stack exception and you need to verify a fix with a bounded curl against the running TS/JS app or API.
---

# Skill: Verify browser exceptions via curl (container or host)

Use when a developer provides a URL that shows a visible exception/error and you need to verify a fix.

## Inputs required (do not assume)
- `<URLS>` (one or more URLs)
- Optional `<APP_CONTAINER>` — compose service / container name when host curl cannot reach the URL
- Optional `<EXCEPTION_STRING>` (if known / provided by the developer)

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
- Prefer host curl first when `<APP_BASE_URL>` / the reported URL is reachable from the agent host.
- If host curl fails with connection refused / DNS and `<APP_CONTAINER>` is known, curl inside that container (do not invent a container name).

## Commands (templates)
1) Curl each URL with a bounded request (example flags: `-sS -L --max-time <seconds>`). Host first; inside `<APP_CONTAINER>` only when needed.
2) Check early output for exception markers (`Error:`, `TypeError`, `Unhandled`, fatal/stack frames, HTTP 5xx); treat as **FAIL**.
3) If `<EXCEPTION_STRING>` was provided, confirm it is **absent** after the fix (OK) or still present (FAIL).
4) If output is large, print only OK/FAIL and first matching line (or `head -n <N>`).

## Stop conditions
- No URL(s) provided.
- Host curl cannot reach the URL and `<APP_CONTAINER>` is unknown/ambiguous.
- The curl command is blocked by allowlist/approval and cannot proceed.
- Output is too large to safely print (switch to OK/FAIL-only reporting).
