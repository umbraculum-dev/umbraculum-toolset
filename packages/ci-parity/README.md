# @umbraculum/ci-parity

CI parity runner for Umbraculum-family repositories. Reproduces static-analysis CI jobs (docs-readmes, lint, typecheck) **inside Docker** from a versioned manifest — one command for local pre-push and GitHub Actions.

## Where this package lives (and why)

This package is in **umbraculum-toolset** under `packages/ci-parity/`, **not** inside `cursor-plugins/`.

| Location | Purpose |
|----------|---------|
| `umbraculum-toolset/packages/ci-parity/` | npm CLI + schema (this package) |
| `umbraculum-toolset/.github/workflows/ci-parity-reusable.yml` | Reusable GHA workflow consumer repos call |
| `umbraculum-toolset/.github/workflows/publish-ci-parity.yml` | Publishes this package to npm on `ci-parity-v*` tags |
| `umbraculum-toolset/cursor-plugins/` | Cursor rules/skills that **tell agents** to run `npx @umbraculum/ci-parity` |
| `umbraculum-dev/.umbraculum/ci-parity.json` | Per-repo manifest (what jobs, which workspaces) |
| `umbraculum-dev/.github/workflows/typecheck.yml` etc. | Per-repo triggers (when to run) |

Consumer repos configure CI; this repo ships the engine.

## Install / run

```bash
npx @umbraculum/ci-parity
npx @umbraculum/ci-parity validate
npx @umbraculum/ci-parity explain
```

Host prerequisites: `git`, `bash`, Docker. Host Node orchestrates Docker only; jobs run in the manifest `runtime.image` (default `node:20-slim`).

## Manifest

Each consumer repo ships `.umbraculum/ci-parity.json` as the single source of truth for jobs, install ordering, and typecheck workspaces.

Optional **`docker.volumes`** (since 1.0.8) — array of `{ "name", "containerPath" }` mounted on the parity container for **local** warm npm cache / `node_modules` persistence (Linux + Docker Desktop macOS). Example names in umbraculum-dev: `umbraculum_npm_cache`, `umbraculum_root_node_modules`. See umbraculum-dev [`docs/DEVELOPMENT-NPM-VOLUMES.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/DEVELOPMENT-NPM-VOLUMES.md). GHA runners remain ephemeral per job.

Canonical guide: [umbraculum-dev `docs/CI-PARITY.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CI-PARITY.md).

## Commands

| Command | Description |
|---------|-------------|
| `ci-parity run` | Run all manifest jobs (default) |
| `ci-parity run --parallel --isolated-install --jobs lint,typecheck` | Parallel job containers; skip shared `/repo/node_modules` volume (T2-PR safe) |
| `ci-parity run --jobs lint,typecheck` | Subset of jobs |
| `ci-parity run --ci` | CI mode: mount checkout instead of `git archive` |
| `ci-parity run --sha <ref>` | Snapshot ref for local runs (default `HEAD`) |
| `ci-parity run --keep` | Retain `/tmp/ci-parity-*` snapshot and logs |
| `ci-parity validate` | Parse manifest + filesystem checks |
| `ci-parity validate --strict` | Also fail on undocumented nested `package.json` dirs |
| `ci-parity explain` | Print execution plan |

Stable agent output line:

```
CI-PARITY-CHECK <short-sha>: docs-readmes=OK lint=OK typecheck=FAIL
```

## Publishing to npm

> **Agents:** publish via **GitHub Actions + tag** only — **not** `npm publish` on a laptop.
> Browser npm login is for humans; routine bumps: tag `ci-parity-vX.Y.Z` on this repo.
> See umbraculum-dev [`AGENTS.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/AGENTS.md) § "npm publish discipline".

**Workflow:** `publish-ci-parity` on **umbraculum-toolset** (Actions tab — not umbraculum-dev).

**Auth (routine):** [npm Trusted Publishing (OIDC)](https://docs.npmjs.com/trusted-publishers/) from GHA — no `NPM_TOKEN`, no laptop OTP. Setup: [umbraculum-dev trusted-publishing doc](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/design/ci-parity-npm-trusted-publishing.md).

**Trigger:** tag `ci-parity-v*` (must match `package.json` version). Requires npm CLI ≥ 11.5.1 and `id-token: write` in the workflow.

```bash
# Maintainer routine (preferred)
cd umbraculum-toolset
# edit packages/ci-parity/package.json version
git commit -am "chore(ci-parity): release X.Y.Z"
git tag ci-parity-vX.Y.Z
git push origin master ci-parity-vX.Y.Z
# → Actions → publish-ci-parity → green → npm view @umbraculum/ci-parity version
```

Full runbook: [umbraculum-dev `docs/design/ci-parity-npm-publish.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/design/ci-parity-npm-publish.md).

**Manual laptop publish:** maintainer-only emergency fallback (may require OTP) — documented in runbook §5; agents must not use it as default.

## Development

```bash
cd umbraculum-toolset
npm ci
npm test -w @umbraculum/ci-parity
npm run build -w @umbraculum/ci-parity
node packages/ci-parity/dist/cli.js explain --manifest /path/to/.umbraculum/ci-parity.json
```

## License

MIT — see [LICENSE](../../LICENSE).
