---
name: pi-sidecar-local-stack-bringup
description: Bring up the Pi sidecar locally with Docker Compose (mock bridge by default; real OpenPLC bridge via env-var override). Use when starting a fresh sidecar dev session or switching bridge modes.
---

# Pi sidecar local-stack bring-up

Use this skill to bring up the Pi sidecar locally via Docker Compose. The default configuration uses the **mock PLC bridge** (no PLC required); an override path switches to the **real OpenPLC bridge** against a locally running OpenPLC Runtime.

This skill does NOT cover field-cabinet deployment (systemd unit on a real Raspberry Pi); see `pi-sidecar/deploy/systemd/` and `pi-sidecar/README.md` for that.

## Inputs required (do not assume)

- `<REPO_ROOT>` (absolute path to the PLC project root)
- `<MODE>` (`mock` or `openplc`) — picks the bridge profile.
- For `<MODE>=openplc`:
  - `<OPENPLC_HOST>` (typically `host.docker.internal` so the container can reach a Linux-host OpenPLC Runtime)
  - `<OPENPLC_PORT>` (typically `502`)
  - `<OPENPLC_UNIT_ID>` (typically `1`)
  - `<MAP_PATH_IN_CONTAINER>` (typically `/app/openplc-modbus-map.example.json`)

## Output format (return exactly)

### Prerequisites

(brief — confirm `<REPO_ROOT>/pi-sidecar/docker-compose.yml` exists; confirm Docker daemon is running)

### Commands

(the bounded list of commands that were run, with their exit codes)

### Stop conditions

(any condition that aborted the run, or `(none triggered)` if all commands succeeded)

### Result

```
SIDECAR_MODE: <MODE>
WEB_UI: http://127.0.0.1:8000 (loopback only)
HEALTHCHECK: ok | fail | not-yet-ready
NOTES: (single line — any visible warnings from `docker compose up`)
```

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling beyond one `curl /healthz` check at the end.
- No `docker compose down -v` or `docker volume rm` (would destroy SQLite history; see rule `05-host-no-rm.mdc`).
- Bounded output: no full `docker compose up` log; no full container log dump (head -30 only for diagnostics).

## Prerequisites

- Docker daemon is running on the host.
- `<REPO_ROOT>/pi-sidecar/docker-compose.yml` exists. For mode `openplc`, `docker-compose.dev.yml` also exists.
- For mode `openplc`: an OpenPLC Runtime is already listening on the host at the URL implied by `<OPENPLC_HOST>:<OPENPLC_PORT>`. (Bring it up first; this skill does NOT start an OpenPLC Runtime.)
- Port `8000` on `127.0.0.1` is free.

## Commands

1. `cd "<REPO_ROOT>/pi-sidecar" && docker compose ps` — see whether the sidecar is already running; if it is and `<MODE>` matches the running config, skip the up step (jump to step 4).
2. For `<MODE>=mock`:
   ```bash
   cd "<REPO_ROOT>/pi-sidecar" && docker compose up --build -d
   ```
   For `<MODE>=openplc`:
   ```bash
   cd "<REPO_ROOT>/pi-sidecar" && \
   PI_SIDECAR_PLC_BRIDGE=openplc \
   PI_SIDECAR_OPENPLC_HOST=<OPENPLC_HOST> \
   PI_SIDECAR_OPENPLC_PORT=<OPENPLC_PORT> \
   PI_SIDECAR_OPENPLC_UNIT_ID=<OPENPLC_UNIT_ID> \
   PI_SIDECAR_OPENPLC_SYMBOL_MAP_PATH=<MAP_PATH_IN_CONTAINER> \
   PI_SIDECAR_REMOTE_CONTROL_ENABLED=true \
   PI_SIDECAR_TRUSTED_NETWORKS=172.16.0.0/12 \
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
   ```
3. `docker compose -f docker-compose.yml [-f docker-compose.dev.yml] logs --tail=20 sidecar` — sanity-check the first 20 lines of the container log (look for `Uvicorn running on http://127.0.0.1:8000` or equivalent startup line).
4. `curl -sS http://127.0.0.1:8000/healthz` — expect literal `ok`.

(Reserve one command slot for an unplanned diagnostic if step 3 or 4 surfaces a surprise.)

## Stop conditions

- Docker daemon is not running → stop and report.
- Port `8000` on `127.0.0.1` is already bound by a different process → stop; ask the developer to free the port or use a different host port.
- The container exits during step 2/3 (visible via `docker compose ps` showing `Exited`) → report the last 30 log lines and stop; do not auto-restart.
- `curl /healthz` returns anything other than `ok` after 5 seconds → report and stop; do not retry-loop.
- The skill is invoked with `<MODE>=openplc` but the OpenPLC Runtime is not reachable from the host (rule out networking first via `nc -zv <OPENPLC_HOST> <OPENPLC_PORT>` outside the container) → stop with a clear diagnostic.

## See also

- Rule `25-pi-sidecar-fastapi-jinja-sqlite-conventions.mdc` — the sidecar layering + env-var contract.
- Rule `06-bench-vs-field-profile.mdc` — why `openplc` mode targets the bench profile.
- `pi-sidecar/DOCKER-COMPOSE-USAGE.md` (in the consuming project) — the longer-form reference for Compose usage.
