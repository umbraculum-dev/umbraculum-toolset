---
name: npm-workspaces-package-lock-invalid-version
description: Use this when npm install / npm ci fails in a monorepo with workspaces and the error includes **Invalid Version** (often caused by corrupted/partial workspac...
---

# Skill: npm workspaces `package-lock.json` “Invalid Version” triage

Use this when `npm install` / `npm ci` fails in a monorepo with workspaces and the error includes **Invalid Version** (often caused by corrupted/partial workspace link entries in a `package-lock.json`).

## Inputs required (do not assume)
- `<NODE_CONTAINER>`
- `<NPM_WORKDIR_IN_CONTAINER>`: directory where you run npm (must contain the failing lockfile)
- `<NPM_CMD>`: the exact failing command (example: `npm ci` or `npm install`)
- `<ERROR_SNIPPET>`: the exact “Invalid Version …” line (or the smallest excerpt that shows it)

## Output format (return exactly)
### Prerequisites

### Commands

### Stop conditions

## Bounds (hard)
- Max **5** commands.
- No loops/polling.
- Never run Node/npm on host for containerized repos.
- No speculative container names or working directories.
- Do not delete lockfiles or `node_modules` unless explicitly permitted; always create a backup first.

## Prerequisites
- Confirm `<NODE_CONTAINER>` is the correct Node container for the repo.
- Confirm `<NPM_WORKDIR_IN_CONTAINER>` is the directory where `<NPM_CMD>` fails and contains the relevant `package-lock.json`.

## Commands (choose ONE path)

### Path A (recommended): patch corrupted workspace link versions (bounded, preserves lockfile)
1) Backup the lockfile:
   - `docker exec -i <NODE_CONTAINER> bash -lc 'cd <NPM_WORKDIR_IN_CONTAINER> && cp -v package-lock.json package-lock.json.bak'`
2) Patch workspace link entries that have invalid/non-string `version` values by pulling the real version from the linked workspace `package.json`:
   - Run:

```bash
docker exec -i <NODE_CONTAINER> bash -lc 'cd <NPM_WORKDIR_IN_CONTAINER> && node - <<'"'"'NODE'"'"'
const fs = require("fs");
const path = require("path");

const lockPath = path.resolve(process.cwd(), "package-lock.json");
const raw = fs.readFileSync(lockPath, "utf8");
const lock = JSON.parse(raw);

if (!lock || typeof lock !== "object" || !lock.packages || typeof lock.packages !== "object") {
  throw new Error("Unexpected lockfile shape: missing packages object");
}

let patched = 0;
for (const meta of Object.values(lock.packages)) {
  if (!meta || typeof meta !== "object") continue;

  const hasLink = meta.link === true;
  const resolved = typeof meta.resolved === "string" ? meta.resolved : "";
  const badVersion = meta.version != null && typeof meta.version !== "string";

  if (!hasLink || !resolved || (!badVersion && typeof meta.version === "string")) {
    continue;
  }

  const targetPkgJson = path.resolve(process.cwd(), resolved, "package.json");
  if (!fs.existsSync(targetPkgJson)) continue;

  const pkg = JSON.parse(fs.readFileSync(targetPkgJson, "utf8"));
  if (!pkg || typeof pkg.version !== "string" || !pkg.version) continue;

  if (meta.version !== pkg.version) {
    meta.version = pkg.version;
    patched++;
  }
}

fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf8");
console.log(`Patched package-lock.json entries: ${patched}`);
NODE'
```
3) Re-run the original npm command:
   - `docker exec -i <NODE_CONTAINER> bash -lc 'cd <NPM_WORKDIR_IN_CONTAINER> && <NPM_CMD>'`

### Path B (fallback): regenerate lockfile (only if allowed)
1) Backup the lockfile:
   - `docker exec -i <NODE_CONTAINER> bash -lc 'cd <NPM_WORKDIR_IN_CONTAINER> && cp -v package-lock.json package-lock.json.bak'`
2) Remove lockfile (and optionally `node_modules` if instructed), then reinstall to regenerate:
   - `docker exec -i <NODE_CONTAINER> bash -lc 'cd <NPM_WORKDIR_IN_CONTAINER> && rm -f package-lock.json && npm install'`

## Stop conditions
- `<NODE_CONTAINER>` or `<NPM_WORKDIR_IN_CONTAINER>` is unknown/ambiguous.
- The command execution is blocked by allowlist/approval.
- The failing error is not actually an `Invalid Version` install failure (return `<ERROR_SNIPPET>` and stop).
- After Path A, `npm` still fails: stop and return (a) node/npm versions, (b) which lockfile dir was used, and (c) the minimal error excerpt.
