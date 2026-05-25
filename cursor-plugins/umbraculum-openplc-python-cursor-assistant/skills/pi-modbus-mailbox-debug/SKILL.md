---
name: pi-modbus-mailbox-debug
description: Read a bounded set of `PI_*` Modbus coils/holding-registers from outside the Pi sidecar to triage "sidecar shows X, PLC shows Y" mismatches. Use when the sidecar UI disagrees with expected PLC state.
---

# Pi Modbus mailbox debug

Use this skill to read `PI_*` coils and holding registers **directly** from the OpenPLC Runtime (bench profile) or the CONTROLLINO MEGA Pure (field profile), bypassing the Pi sidecar entirely. The goal is to determine whether a sidecar-reported value matches what the PLC actually publishes — i.e. is the bug in the sidecar's reading, or in the PLC's writing?

This skill performs **read-only** Modbus operations. It MUST NOT write any coil or register (see rule `15-subagent-delegation-guardrails.mdc`).

## Inputs required (do not assume)

- `<TRANSPORT>` (`tcp` or `rtu`) — picks the transport profile (see rule `06-bench-vs-field-profile.mdc`).
- For `tcp`: `<MODBUS_HOST>` (e.g. `127.0.0.1`), `<MODBUS_PORT>` (default `502`), `<UNIT_ID>` (default `1`).
- For `rtu`: `<SERIAL_PORT>` (e.g. `/dev/ttyACM0`), `<BAUDRATE>` (default `115200`), `<UNIT_ID>` (default `1`).
- `<TARGET_ADDRESS>` (the specific coil or holding-register address from `pi-sidecar/openplc-modbus-map.example.json` — e.g. coil `808` for `cold_low.alarm_present`, holding register `208` for `cold_temp_deci_c`).
- `<TARGET_TYPE>` (`coil` or `holding_register`).
- `<TARGET_NAME>` (human label from the map JSON — e.g. `cold_low.alarm_present`, `reservoirs.cold_temp_deci_c`).

## Output format (return exactly)

### Prerequisites

(brief — confirm the transport choice, the target address, type, and name; confirm `pymodbus` is importable)

### Commands

(the bounded list of commands that were run, with their exit codes)

### Stop conditions

(any condition that aborted the run, or `(none triggered)` if all commands succeeded)

### Result

```
TARGET: <TARGET_NAME> @ <TARGET_TYPE> <TARGET_ADDRESS>
RAW VALUE: <int or bool>
INTERPRETATION: (e.g. "alarm_present=TRUE", "cold_temp_deci_c=125 → 12.5 °C")
TRANSPORT: <TRANSPORT> via <host:port or serial_port:baud> unit=<UNIT_ID>
```

## Bounds (hard)

- Max 5 commands total.
- No loops; no polling; no continuous reads. A single point-in-time read per target.
- No write operations (`write_coil`, `write_register`, `write_coils`, `write_registers`). If a write is needed, surface that as a stop condition — do not perform it.
- Bounded output: no full map dump; no register-range scans wider than 16 addresses; no transcript of all attempted addresses.

## Prerequisites

- `pymodbus` is installable (or a system Python interpreter has it). The default invocation uses `python3 -m pip install --user pymodbus==<pinned>` from `pi-sidecar/pyproject.toml` if absent; do not silently switch to a different Modbus library.
- For `tcp`: an OpenPLC Runtime instance is listening on `<MODBUS_HOST>:<MODBUS_PORT>` and has issued `start_modbus()` (verify via the Runtime web UI).
- For `rtu`: the CONTROLLINO MEGA Pure is plugged into `<SERIAL_PORT>` and is running its uploaded program.
- The Pi sidecar SHOULD be stopped (or its polling paused) during the read — concurrent polling does not corrupt the read but it confuses the timing analysis.

## Commands

1. `python3 -c "import pymodbus, sys; print(pymodbus.__version__)"` — confirm pymodbus is available.
2. For TCP, the read script (single command via heredoc):

```bash
python3 - <<'PY'
from pymodbus.client import ModbusTcpClient
c = ModbusTcpClient("<MODBUS_HOST>", port=<MODBUS_PORT>)
c.connect()
# For coil:
# rsp = c.read_coils(<TARGET_ADDRESS>, count=1, slave=<UNIT_ID>); print("coil", rsp.bits[0])
# For holding register:
# rsp = c.read_holding_registers(<TARGET_ADDRESS>, count=1, slave=<UNIT_ID>); print("hr", rsp.registers[0])
c.close()
PY
```

3. For RTU, the read script (single command via heredoc):

```bash
python3 - <<'PY'
from pymodbus.client import ModbusSerialClient
c = ModbusSerialClient(port="<SERIAL_PORT>", baudrate=<BAUDRATE>, bytesize=8, parity="N", stopbits=1, timeout=1)
c.connect()
# For coil:
# rsp = c.read_coils(<TARGET_ADDRESS>, count=1, slave=<UNIT_ID>); print("coil", rsp.bits[0])
# For holding register:
# rsp = c.read_holding_registers(<TARGET_ADDRESS>, count=1, slave=<UNIT_ID>); print("hr", rsp.registers[0])
c.close()
PY
```

(Pick step 2 OR step 3 based on `<TRANSPORT>`; never both. If both transports are needed for a comparison, run this skill twice.)

4. (Optional, only if Step 2/3 returned an unexpected zero/garbage value) Re-read the **address ±1** to verify the read landed at the intended offset (some sidecar bugs are off-by-one address derivations).

## Stop conditions

- `pymodbus` is not available and `pip install` requires network access the environment doesn't have → stop and report.
- `<TARGET_ADDRESS>` is not present in `pi-sidecar/openplc-modbus-map.example.json` (sanity check) → stop; the address is likely fabricated.
- The Modbus connection fails (host unreachable, serial port busy, RTU timeout > 3 s) → stop and report the transport error verbatim; do not retry indefinitely.
- A write operation is requested → STOP; this skill is read-only by contract.

## See also

- Rule `08-pi-modbus-contract-and-runtime-upload.mdc` — the contract this skill reads against.
- Rule `06-bench-vs-field-profile.mdc` — picks the transport.
- `pi-sidecar/openplc-modbus-map.example.json` — the canonical address map.
- Subagent `pi-modbus-mailbox-inspector` — the read-only delegation that wraps this skill.
