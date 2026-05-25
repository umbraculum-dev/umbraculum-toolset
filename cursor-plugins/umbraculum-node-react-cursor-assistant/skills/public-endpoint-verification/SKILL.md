---
name: public-endpoint-verification
description: Verify a TS/JS web app or API endpoint against a running service after any non-doc change. Use as the wrap-up gate enforced by `umbraculum-toolset-common/rules/45-public-endpoint-verification.mdc`. Idempotent (GET) endpoints run automatically; non-idempotent endpoints prompt before executing.
---

# Skill: Public-endpoint verification (TS/JS)

Use this when wrapping up any non-doc change to a TS/JS service that has a reachable URL — Node API (Fastify/Express/Hono), Next.js / Remix / React Router app, sidecar HTTP listener, internal control-panel API.

This skill is enforced by `umbraculum-toolset-common/rules/45-public-endpoint-verification.mdc`. The parent agent's final summary MUST end with the `Endpoint verification: PASSED|FAILED|SKIPPED ...` line that the rule requires; this skill provides the data needed to write that line.

## Inputs required (do not assume)

- `<APP_BASE_URL>`: base URL of the service under verification (example: `http://localhost:3000`, `http://localhost:18080`, `http://api:8080`).
- `<AFFECTED_ROUTE>`: the route path the change touches (example: `/api/v1/widgets/:id`, `/healthz`). If the change touches multiple routes, pick at most ONE representative for this skill invocation.
- `<HTTP_METHOD>`: one of `GET | HEAD | OPTIONS | POST | PUT | PATCH | DELETE`.
- Optional `<APP_CONTAINER>`: the docker-compose service name running the app (example: `web`, `api`). Required when curl from host won't resolve the service name.
- Optional `<AUTH_HEADER>`: a header value the developer authorizes for the verification request (example: `Authorization: Bearer <test-token>`). Do not invent tokens.

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)

- Max **5** commands.
- No loops, no polling. A single rerun is allowed only when a transient (DNS / timeout) failure looks recoverable.
- No speculative `<APP_BASE_URL>` / `<AFFECTED_ROUTE>` / `<APP_CONTAINER>` / `<AUTH_HEADER>` values — stop and ask the developer instead.
- Bounded output: HTTP status, total bytes, first matching error line (if any), and a one-line verdict. NEVER dump full response body, full headers, or full HTML.
- For `<HTTP_METHOD>` other than `GET | HEAD | OPTIONS`, this skill MUST stop and ask the developer to confirm execution OR provide a safe GET alternative before issuing any command.

## Prerequisites

- Local stack is up (`docker compose ps` or equivalent shows the expected service in `running`/`healthy`).
- `<APP_BASE_URL>` is reachable from the agent's network context. If curl from host fails with `Connection refused` and `<APP_CONTAINER>` is provided, retry inside the container.
- For non-`GET` methods: explicit developer authorization captured in the chat for this exact request.

## Commands (templates)

1) Smoke-gate the service is up:

   ```
   curl -fsS -o /dev/null -w '%{http_code}\n' --max-time 5 <APP_BASE_URL>/healthz
   ```

   (Or `<APP_BASE_URL>` itself if no health endpoint exists.) Treat non-2xx or refused as `container-not-running` SKIP.

2) Verify the affected route:

   ```
   curl -sS -o /tmp/_endpoint_verify_body.txt \
     -w 'HTTP %{http_code}  size=%{size_download}\n' \
     -X <HTTP_METHOD> \
     [-H '<AUTH_HEADER>'] \
     --max-time 15 \
     <APP_BASE_URL><AFFECTED_ROUTE>
   ```

   Treat 2xx as `PASSED`. Treat 4xx/5xx as `FAILED` and extract one error line (#4).

3) If host curl returned `Connection refused` and `<APP_CONTAINER>` is provided, retry inside the container:

   ```
   docker compose exec -T <APP_CONTAINER> curl -sS -o /tmp/_endpoint_verify_body.txt \
     -w 'HTTP %{http_code}  size=%{size_download}\n' \
     -X <HTTP_METHOD> [-H '<AUTH_HEADER>'] --max-time 15 \
     http://localhost:<INTERNAL_PORT><AFFECTED_ROUTE>
   ```

4) For 4xx/5xx responses, extract a bounded error excerpt:

   ```
   head -c 1000 /tmp/_endpoint_verify_body.txt \
     | grep -m1 -E '"error"|"message"|stack|Error:|Exception' \
     || head -n 3 /tmp/_endpoint_verify_body.txt
   ```

5) (Alternative) Browser-tool smoke when the change is UI-affecting and the integrated browser is connected: navigate to `<APP_BASE_URL><AFFECTED_ROUTE>`, capture an aria snapshot or screenshot, confirm no `Application error`, `Cannot GET ...`, or runtime error overlay. See `agentic-browser-web-app` skill for the full protocol.

## Stop conditions

- `<APP_BASE_URL>`, `<AFFECTED_ROUTE>`, or `<HTTP_METHOD>` is unknown / ambiguous → emit `Endpoint verification: SKIPPED <url> (reason: endpoint-unknown)`.
- `<HTTP_METHOD>` is non-idempotent and the developer has not authorized → emit `Endpoint verification: SKIPPED <url> (reason: non-idempotent-and-no-safe-alternative)` (or `user-rejected` if they explicitly declined).
- Smoke-gate (#1) returns non-2xx or `Connection refused` and the container cannot be reached → emit `Endpoint verification: SKIPPED <url> (reason: container-not-running)`.
- Required curl is blocked by allowlist/approval and the developer declines → emit `Endpoint verification: SKIPPED <url> (reason: user-rejected)`.
- Output would be unbounded (e.g. a multi-MB JSON response) → switch to header-only verification (`-I`) and a status-line verdict.

## Composition

- This skill is the **minimum** required by `45-public-endpoint-verification`. Heavier verification (deterministic Playwright spec, agentic browser run, agentic-CLI smoke) remains gated behind their own skills (`agentic-browser-web-app`, `agentic-e2e-runbook`); teams free to layer those on top.
- For URL+exception inputs (developer hands you a stack trace), `curl-exception-verification` skill still applies and adds the framework-specific cache-flush / DI-recompile dance; this skill complements it as the wrap-up gate.

## Fits the system

- **Frontier now**: a single deterministic skill the agent uses to satisfy the rule's `Endpoint verification: ...` summary contract; the bounded output keeps the wrap-up cheap and the verdict is regex-checkable.
- **Local subagents (future)**: a small, replayable runbook a local `endpoint-verifier` subagent can execute against a project-supplied (`<APP_BASE_URL>`, `<AFFECTED_ROUTE>`, `<HTTP_METHOD>`) tuple; output structure is fixed (status, byte-count, error-excerpt, verdict).
