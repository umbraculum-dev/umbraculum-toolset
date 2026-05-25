---
name: public-endpoint-verification
description: Verify a Pi sidecar FastAPI endpoint (or any HTTP listener wired into the OpenPLC project) against the running service after any non-doc change. Use as the wrap-up gate enforced by `umbraculum-toolset-common/rules/45-public-endpoint-verification.mdc`. Idempotent (GET) endpoints run automatically; non-idempotent endpoints prompt before executing.
---

# Skill: Public-endpoint verification (Pi sidecar / FastAPI)

Use this when wrapping up any non-doc change to a Pi sidecar HTTP service (FastAPI, Flask, or any HTTP listener) that exposes a public endpoint — the sidecar's REST/JSON API, the WebSocket-bridge HTTP control plane, the dashboard backend, etc.

This skill is enforced by `umbraculum-toolset-common/rules/45-public-endpoint-verification.mdc`. The parent agent's final summary MUST end with the `Endpoint verification: PASSED|FAILED|SKIPPED ...` line that the rule requires; this skill provides the data needed to write that line.

This skill explicitly does NOT replace the `pi-modbus-mailbox-debug` skill. Modbus-coil / holding-register inspection is a separate transport (Modbus TCP/RTU), not the FastAPI HTTP surface this skill covers.

## Inputs required (do not assume)

- `<SIDECAR_CONTAINER>`: the docker-compose service name running the sidecar. Resolve via `DEVELOPMENT-LOCAL.md`.
- `<SIDECAR_BASE_URL>`: base URL of the sidecar HTTP service (example: `http://localhost:8000`).
- `<AFFECTED_ROUTE>`: the FastAPI / HTTP route the change touches (example: `/api/v1/coil/<addr>`, `/healthz`). If the change touches multiple routes, pick at most ONE representative.
- `<HTTP_METHOD>`: one of `GET | HEAD | OPTIONS | POST | PUT | PATCH | DELETE`.

## Output format (return exactly)

### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)

- Max **5** commands.
- No loops, no polling.
- No speculative `<SIDECAR_CONTAINER>` / `<SIDECAR_BASE_URL>` / `<AFFECTED_ROUTE>` values — stop and ask the developer instead.
- Bounded output: HTTP status, byte count, first matching error line, one-line verdict. NEVER dump full JSON, full Modbus maps, or full Python tracebacks.
- For `<HTTP_METHOD>` other than `GET | HEAD | OPTIONS`, this skill MUST stop and ask the developer to confirm execution OR provide a safe GET alternative.
- **Particular care for write-coil / write-register endpoints**: these can drive physical PLC outputs. Never invoke without explicit, named-confirmation authorization from the developer.

## Prerequisites

- The Pi sidecar stack is up and the bridge mode is the one the developer intends (mock vs real OpenPLC bridge — see `pi-sidecar-local-stack-bringup` skill).
- For non-`GET` methods, especially anything that mutates Modbus state: explicit developer authorization for this exact request.

## Commands (templates)

1) Smoke-gate the sidecar is up:

   ```
   curl -fsS -o /dev/null -w '%{http_code}\n' --max-time 5 <SIDECAR_BASE_URL>/healthz
   ```

   Treat non-2xx or refused as `container-not-running` SKIP.

2) Verify the affected route:

   ```
   curl -sS -o /tmp/_endpoint_verify_body.txt \
     -w 'HTTP %{http_code}  size=%{size_download}\n' \
     -X <HTTP_METHOD> --max-time 10 \
     <SIDECAR_BASE_URL><AFFECTED_ROUTE>
   ```

   Treat 2xx as `PASSED`. Treat 4xx/5xx as `FAILED`.

3) If host curl returns `Connection refused`, retry inside the container:

   ```
   docker compose exec -T <SIDECAR_CONTAINER> curl -sS -o /tmp/_endpoint_verify_body.txt \
     -w 'HTTP %{http_code}  size=%{size_download}\n' \
     -X <HTTP_METHOD> --max-time 10 \
     http://localhost:<INTERNAL_PORT><AFFECTED_ROUTE>
   ```

4) Extract a bounded error excerpt for 4xx/5xx:

   ```
   head -c 1000 /tmp/_endpoint_verify_body.txt \
     | grep -m1 -E '"detail"|"error"|Traceback|Exception' \
     || head -n 3 /tmp/_endpoint_verify_body.txt
   ```

5) (Optional) Cross-check the sidecar logs for new ERROR/CRITICAL lines since the verification timestamp:

   ```
   docker compose logs --since 30s <SIDECAR_CONTAINER> 2>/dev/null \
     | grep -E 'ERROR|CRITICAL|Traceback' | head -n 5 \
     || echo 'OK: no recent ERROR/CRITICAL'
   ```

## Stop conditions

- `<SIDECAR_CONTAINER>`, `<SIDECAR_BASE_URL>`, or `<AFFECTED_ROUTE>` is unknown / ambiguous → emit `Endpoint verification: SKIPPED <url> (reason: endpoint-unknown)`.
- `<HTTP_METHOD>` is non-idempotent (especially Modbus-write equivalents) and the developer has not authorized → emit `Endpoint verification: SKIPPED <url> (reason: non-idempotent-and-no-safe-alternative)`.
- The sidecar is not running → emit `Endpoint verification: SKIPPED <url> (reason: container-not-running)`.
- The curl is blocked by allowlist/approval and the developer declines → emit `Endpoint verification: SKIPPED <url> (reason: user-rejected)`.
- Output would be unbounded → switch to header-only (`-I`) verification.

## Composition

- For Modbus-coil / holding-register reads (PI_* mailbox), see `pi-modbus-mailbox-debug` skill — separate transport, separate verification path.
- For PLC source changes (LD/ST), see `plc-variable-prefix-verification` skill — separate authoring guardrail.
- For the sidecar's local stack, see `pi-sidecar-local-stack-bringup` skill.

## Fits the system

- **Frontier now**: a single deterministic skill the agent uses to satisfy the rule's `Endpoint verification: ...` summary contract on Pi-sidecar / FastAPI sessions; bounded output keeps the wrap-up cheap and the verdict is regex-checkable.
- **Local subagents (future)**: a sidecar-flavored runbook a local `endpoint-verifier` subagent can execute against (`<SIDECAR_CONTAINER>`, `<SIDECAR_BASE_URL>`, `<AFFECTED_ROUTE>`, `<HTTP_METHOD>`); the rule's required verdict line is regex-checkable, and the explicit "no Modbus-write without named confirmation" bound makes physical-output safety auditable.
