# umbraculum-toolset

A monorepo of tools and assistants for the umbraculum family of projects.

## What's in here

| Path | What |
|---|---|
| [`cursor-plugins/`](./cursor-plugins/) | Four Cursor assistant plugins (rules + skills + agents): one common plugin carrying the language-agnostic meta-framework rules + the `generate-development-local` skill, plus three domain plugins targeting generic TS/JS/React (`umbraculum-node-react-cursor-assistant`), the umbraculum-platform TS/JS monorepo (`umbraculum-platform-tsjs-cursor-assistant`), and the OpenPLC + Python + Modbus + hardware-doc industrial-automation sister-repo (`umbraculum-openplc-python-cursor-assistant`). |
| [`packages/ci-parity/`](./packages/ci-parity/) | **`@umbraculum/ci-parity`** — MIT npm CLI + JSON manifest schema + reusable GHA workflow for local/CI static-analysis parity. Sibling to the Cursor plugins, not inside them. |

Future tooling (CLI helpers, schema generators, project scaffolds, etc.) will land here as additional top-level folders alongside `cursor-plugins/` and `packages/`.

## Repository layout

```
umbraculum-toolset/
├── README.md                            (this file)
├── CONTRIBUTING.md                      (DCO sign-off + Cursor co-author trailer + commit/PR conventions; root-level only — does NOT ship with the marketplace plugins)
├── LICENSE                              (MIT)
├── package.json                         (npm workspaces root — `@umbraculum/ci-parity`)
├── .gitignore
├── packages/
│   └── ci-parity/                       (@umbraculum/ci-parity — manifest-driven CI parity CLI)
├── scripts/
│   └── git-hooks/
│       └── prepare-commit-msg           (canonical DCO + Cursor co-author hook; activate per-clone via `git config core.hooksPath scripts/git-hooks` — see CONTRIBUTING.md)
└── cursor-plugins/                      (multi-plugin Cursor package — see its own README)
    ├── README.md
    ├── .cursor-plugin/marketplace.json
    ├── docs/
    │   ├── PLUGIN-ROADMAP.md
    │   └── archive/
    │       └── foundation-hardening-plugin-pack.plan.md
    ├── scripts/install-local.sh         (rsync-based local installer for all four plugins; --prune flag for orphan-folder cleanup after renames)
    ├── umbraculum-toolset-common/        (language-agnostic meta-framework rules + generate-development-local skill; install alongside any domain plugin)
    ├── umbraculum-node-react-cursor-assistant/    (generic TS/JS)
    ├── umbraculum-platform-tsjs-cursor-assistant/ (umbraculum-platform TS/JS half)
    └── umbraculum-openplc-python-cursor-assistant/ (OpenPLC + Python + Modbus + hardware-doc sister-repo)
```

## Quick links

- **Cursor plugins overview + install + pairing rationale**: [`cursor-plugins/README.md`](./cursor-plugins/README.md)
- **`@umbraculum/ci-parity`** (npm CLI sibling to plugins — CI parity runner): [`packages/ci-parity/README.md`](./packages/ci-parity/README.md); consumer docs in [umbraculum-dev `docs/CI-PARITY.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CI-PARITY.md); publish runbook in [`docs/design/ci-parity-npm-publish.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/design/ci-parity-npm-publish.md)
- **Witness-rule contract for downstream `AGENTS.md` consumers** (how repos that install these plugins should verify the plugin pack is loaded — relevant whenever an `AGENTS.md` apparatus self-check is being authored or updated): [`cursor-plugins/README.md` § "Witness-rule contract for downstream `AGENTS.md` consumers"](./cursor-plugins/README.md#witness-rule-contract-for-downstream-agentsmd-consumers)
- **Recommended Prisma plugin (official Cursor marketplace; umbraculum-dev)** — not part of this repo; install from Cursor Marketplace alongside the toolset: [`umbraculum-dev` `docs/CURSOR-PLUGINS.md` § Strongly recommended — Prisma](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CURSOR-PLUGINS.md#strongly-recommended--prisma-official-cursor-marketplace-plugin)
- **Contributing (DCO sign-off, Cursor co-author trailer, commit-message + PR conventions)**: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- **Future plugin roadmap + private-vs-marketplace transition notes**: [`cursor-plugins/docs/PLUGIN-ROADMAP.md`](./cursor-plugins/docs/PLUGIN-ROADMAP.md)
- **Foundation-hardening plugin-pack origin plan (archived)**: [`cursor-plugins/docs/archive/foundation-hardening-plugin-pack.plan.md`](./cursor-plugins/docs/archive/foundation-hardening-plugin-pack.plan.md)

## Versioning

The public repository baseline starts at `v0.0.1`. Each plugin under `cursor-plugins/` carries its own `.cursor-plugin/plugin.json` `version` field, currently aligned to that baseline. Future coordinated releases should use toolset-level tags such as `vX.Y.Z`; plugin-isolated releases may additionally use plugin-prefixed tags when a plugin ships on its own cadence.

## License

[MIT](./LICENSE) — see the LICENSE file at the repo root.
