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

Canonical guide: [umbraculum-dev `docs/CI-PARITY.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CI-PARITY.md).

## Commands

| Command | Description |
|---------|-------------|
| `ci-parity run` | Run all manifest jobs (default) |
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

**Workflow:** `publish-ci-parity` in this repo (Actions tab on **umbraculum-toolset**, not umbraculum-dev).

**Trigger:** push tag `ci-parity-v*` (e.g. `ci-parity-v1.0.0`).

**Secret required:** `NPM_TOKEN` (npm granular token, read-write, max **90 days**) in umbraculum-toolset → Settings → Secrets → Actions. Rotate before expiry — see publish runbook § "Token rotation".

First publish without `NPM_TOKEN` fails with `npm error code ENEEDAUTH` after build/tests pass — expected. Add the secret and re-run the workflow.

**Never commit or paste tokens in chat.** If leaked, revoke on npm immediately and issue a new token.

Full runbook (maintainers): [umbraculum-dev `docs/design/ci-parity-npm-publish.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/design/ci-parity-npm-publish.md).

```bash
# Manual fallback
npm login
npm publish -w @umbraculum/ci-parity --access public
```

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
