# @umbraculum/ci-parity

CI parity runner for Umbraculum-family repositories. Reproduces static-analysis CI jobs (docs-readmes, lint, typecheck) **inside Docker** from a versioned manifest — one command for local pre-push and GitHub Actions.

## Install / run

```bash
npx @umbraculum/ci-parity
npx @umbraculum/ci-parity validate
npx @umbraculum/ci-parity explain
```

Host prerequisites: `git`, `bash`, Docker. Host Node is only used to orchestrate Docker; job commands run in the manifest `runtime.image` (default `node:20-slim`).

## Manifest

Each consumer repo ships [`.umbraculum/ci-parity.json`](../../.umbraculum/ci-parity.json) as the single source of truth for which jobs run, install ordering, and typecheck workspaces.

See the canonical guide in umbraculum-dev: [`docs/CI-PARITY.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CI-PARITY.md).

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

## License

MIT — see [LICENSE](../../LICENSE).
