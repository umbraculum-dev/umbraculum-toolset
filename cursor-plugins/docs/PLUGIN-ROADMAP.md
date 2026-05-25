# Plugin roadmap and marketplace considerations

| Field | Value |
|---|---|
| **Status** | Living document |
| **Owner** | umbraculum-toolset maintainers |
| **Audience** | plugin authors + future contributors who need to understand where this repo is heading |
| **Last meaningful update** | 2026-05-25 (`v0.0.1` public baseline after repository history reset) |

---

## 1. Current state (2026-05-25, `v0.0.1` public baseline)

This repo hosts **four plugins** under `~/dkprojects/rfapps/umbraculum-toolset/cursor-plugins/`:

| Plugin | Audience | Distribution |
|---|---|---|
| `umbraculum-toolset-common` | every umbraculum-toolset domain plugin (install alongside) — carries language-agnostic meta-framework rules + the `generate-development-local` skill | private (local folder install + Git remote when added) |
| `umbraculum-node-react-cursor-assistant` | any TS/JS project (the `umbraculum-` brand prefix is for marketplace name-uniqueness, not project-specificity) | private |
| `umbraculum-platform-tsjs-cursor-assistant` | umbraculum-platform projects (e.g. umbraculum-dev) — companion of `umbraculum-node-react-cursor-assistant`; covers the TS/JS half of the platform | private |
| `umbraculum-openplc-python-cursor-assistant` | the openplc/brewery sister-repo (Python + OpenPLC + FastAPI + Modbus + hardware-doc surface) | private |

### Naming baseline

The current public baseline starts with four brand-prefixed plugin names. Two TS/JS plugin names were settled before the public baseline for marketplace name-uniqueness and to make the install matrix read naturally as `common + <ecosystem>`:

| Earlier private-history name | Public-baseline name | Why |
|---|---|---|
| `node-react-cursor-assistant` | `umbraculum-node-react-cursor-assistant` | Brand-prefix added so every plugin name has the same shape (`umbraculum-*`) and the marketplace name is owned. The plugin is still generic-suitable TS/JS; the prefix is for name-availability, not project-specificity. |
| `umbraculum-cursor-assistant` | `umbraculum-platform-tsjs-cursor-assistant` | Mirrors the `umbraculum-openplc-python-cursor-assistant` naming shape (`<brand>-<platform-half>-<lang/stack>-cursor-assistant`) so the install matrix and pairing prose read symmetrically. |

The current tree carries only the public-baseline names. The installer also accepts `--prune` for cleaning up orphan pre-baseline folders in `~/.cursor/plugins/local/`.

All four plugins are currently **private**: they're installed in Cursor from a local folder path (or from a Git remote once one is configured), not from the Cursor marketplace.

---

## 1b. Cursor bug: local-plugin loader rejects symlinks (discovered 2026-05-18)

**TL;DR.** Cursor's docs at `cursor.com/docs/plugins.md` → "Test plugins locally" tell you `ln -s /path/to/my-plugin ~/.cursor/plugins/local/my-plugin` is a supported "faster iteration" install method. **It does not work.** The plugin loader skips symlinks silently. Install via real folder copies (rsync) — see `cursor-plugins/scripts/install-local.sh`.

### Reproduction

1. `mkdir -p ~/.cursor/plugins/local`
2. `ln -s ~/dkprojects/rfapps/umbraculum-toolset/cursor-plugins/umbraculum-node-react-cursor-assistant ~/.cursor/plugins/local/umbraculum-node-react-cursor-assistant`
3. Cursor → **Developer: Reload Window**.
4. **Symptom:** no rules / skills / agents from the plugin appear anywhere — Settings → Rules, the agent skills surface, the MCP servers list. The plugin is silently invisible.
5. **Log evidence** in `~/.config/Cursor/logs/<session>/window<N>/exthost/anysphere.cursor-agent-exec/Cursor Plugins.log`:

   ```
   [info] loadUserLocalPlugins completed in N.Nms (0 plugins loaded)
   ```

   The path `~/.cursor/plugins/local/` IS being scanned (the variable Cursor uses internally is `g7 = "local"`); the scan finds the symlinked entry and discards it.

### Root cause

The loader in `cursor-agent-exec/dist/main.js` (de-minified excerpt):

```js
const o = path.join(home, ".cursor", "plugins", "local");  // g7 === "local"
const c = await fs.readdir(o, { withFileTypes: true });
for (const t of c) {
    if (!t.isDirectory()) continue;       // <-- THIS REJECTS SYMLINKS
    if (t.name.startsWith(".")) continue;
    ...
}
```

Node's `Dirent.isDirectory()` (with `withFileTypes: true`) classifies entries by their `d_type` without following the symlink, so a symlink-to-directory returns `isDirectory(): false, isSymbolicLink(): true`. The loader's `continue` rejects all three categories we'd care about: symlinks to directories, symlinks to files, broken symlinks. Verified locally:

```bash
node -e "for (const e of require('fs').readdirSync(require('os').homedir()+'/.cursor/plugins/local', {withFileTypes:true})) console.log(e.name, e.isDirectory(), e.isSymbolicLink())"
# umbraculum-toolset-common false true
# umbraculum-node-react-cursor-assistant false true
# umbraculum-platform-tsjs-cursor-assistant false true
# umbraculum-openplc-python-cursor-assistant false true
```

The correct check would be either `(t.isDirectory() || t.isSymbolicLink())` or `t.isDirectory() || fs.statSync(path.join(o, t.name)).isDirectory()` (i.e., follow the symlink and re-check). The marketplace cache path (`~/.cursor/plugins/cache/cursor-public/...`) is unaffected because Cursor populates it with real folders cloned from Git.

### Workaround in this repo

`cursor-plugins/scripts/install-local.sh` rsyncs each of the four plugin folders (the common plugin first, then the three domain plugins) into `~/.cursor/plugins/local/<plugin-name>/` as a real directory (excluding `.git/` and `node_modules/`), removing any stale symlinks first. Re-run after every `git pull` in this repo. The README's "Local folder install" section documents this as the only working method.

### When to revisit

- After each Cursor update, re-test the `ln -s … ~/.cursor/plugins/local/…` flow (Step 1-4 above) and check the log for `loadUserLocalPlugin <name> loaded in …` lines. If symlinks load, retire the rsync script and revert the README to a clean `ln -s` recipe.
- If we end up filing this upstream: the suggested fix is the one-line change quoted above (accept `isSymbolicLink()` entries, optionally after a follow-the-link sanity check). Repro repo can be a 3-file plugin (`.cursor-plugin/plugin.json` + `rules/foo.mdc` + `skills/bar/SKILL.md`) symlinked from anywhere into `~/.cursor/plugins/local/`.

### Cross-references

- README's "Local folder install" section (what users need to do today).
- `cursor-plugins/scripts/install-local.sh` (the workaround).
- §3 of this roadmap ("Private plugin vs Cursor marketplace plugin") is unaffected; the marketplace install path uses Cursor's own clone-and-cache flow which produces real directories.

---

## 1c. Witness-rule contract for downstream `AGENTS.md` consumers (loader-behavior fact)

**TL;DR.** Cursor's loader auto-attaches rules with `alwaysApply: false` + `globs:` only when a matching file is in the conversation's active context. Such rules are silently absent from agent rule-list introspection in conversations with no matching file open, even when the plugin is correctly installed. Downstream `AGENTS.md` apparatus self-checks must therefore choose witness rules carefully — `alwaysApply: true` rules can be verified by rule-list introspection; conditional (glob-scoped) rules must be verified by reading the rule's canonical installed path at `~/.cursor/plugins/local/<plugin-name>/rules/<rule>.mdc`.

This is the third loader-behavior fact documented in this roadmap, alongside §1b (the symlink-loader bug) and §5 (the no-manifest-level-dependency verification). The full contract — two-category model (unconditional vs conditional), authoring guidance for downstream `AGENTS.md` files, anti-pattern warning against flipping `alwaysApply: true` to "fix" a failing witness check, and the per-plugin witness-rule registry — lives at the toolset level in [`../README.md` § "Witness-rule contract for downstream `AGENTS.md` consumers"](../README.md#witness-rule-contract-for-downstream-agentsmd-consumers). When that registry changes (plugin author renames or recategorizes a witness rule), bump the affected plugin's `version` in its `.cursor-plugin/plugin.json`, update the registry table, and notify downstream `AGENTS.md` maintainers — the contract is part of the plugin's public surface area.

---

## 2. `umbraculum-toolset-common`

### Status

The public baseline includes `umbraculum-toolset-common`. The original private-history plan anticipated ~12 rules moving into the shared plugin; the actual move was **3 rules + 1 skill**. The reason for the gap is captured below as the "Strategy C trade-off".

| Plugin | Layout |
|---|---|
| `umbraculum-toolset-common/.cursor-plugin/plugin.json` | manifest |
| `umbraculum-toolset-common/README.md` | install-alongside framing + what's in / what's out |
| `umbraculum-toolset-common/docs/DESIGN-NOTES.md` | in-scope / out-of-scope test for future contributions, Strategy C analysis table, versioning policy |
| `umbraculum-toolset-common/rules/00-development-local-addendum-gate.mdc` | moved + neutralized (ecosystem-agnostic examples) |
| `umbraculum-toolset-common/rules/12-skill-contract.mdc` | moved + neutralized (no JS/TS globs; `alwaysApply: true`) |
| `umbraculum-toolset-common/rules/41-commit-message-ticket-prefix.mdc` | moved + neutralized (cross-reference paragraph dropped) |
| `umbraculum-toolset-common/skills/generate-development-local/SKILL.md` | moved + neutralized (consuming plugin's template path is now a `<PLUGIN_TEMPLATE_PATH>` input) |

The three domain plugins each deleted their copies of those four files in the same release.

### The Strategy C trade-off (why only 3 rules + 1 skill moved, not ~12)

The original private-history candidate list named ~12 rules. We audited each pair (node-react vs openplc) before moving anything:

| Rule | Diff between plugin copies | Decision |
|---|---|---|
| `00-development-local-addendum-gate.mdc` | 2-line example list | **moved** (neutralized example list to a union of both) |
| `12-skill-contract.mdc` | placeholder examples + JS/TS globs | **moved** (neutralized placeholders, `alwaysApply: true`, no globs) |
| `41-commit-message-ticket-prefix.mdc` | example commit text + 1 cross-reference paragraph | **moved** (neutralized example, dropped cross-reference) |
| `00-workflow.mdc` | different "before any work" preambles | stayed (substantive divergence) |
| `05-host-no-rm.mdc` | openplc adds "Specifically forbidden in this project" PLC-source list | stayed (substantive) |
| `13-rule-skill-authoring-gate.mdc` | openplc adds "Domain-specific authoring nudges" | stayed (substantive) |
| `14-subagent-contract.mdc` | openplc adds Modbus-write anti-patterns | stayed (substantive) |
| `15-subagent-delegation-guardrails.mdc` | openplc adds extensive PLC-source/Modbus guardrails | stayed (substantive) |
| `42-merge-conflicts-no-behavior-change.mdc` | openplc adds `pous/programs/main.ld` ladder-graph caveat | stayed (substantive) |
| `96-blocked-edit-tee-fallback.mdc` | openplc adds binary-file (PDF/PNG/SVG) note | stayed (substantive) |
| `97-plans-must-include-canonical-absolute-paths.mdc` | very different "Special rule for X" sections | stayed (substantive) |
| `98-python-dir-listing-over-glob.mdc` | openplc adds build-pipeline-specific context | stayed (substantive) |

"Strategy C" = **only truly-identical or trivially-different artifacts move; rules with substantive per-ecosystem additions stay in their plugins.** Forcing the "stayed" rules into a neutral common copy would erase the per-ecosystem tone (PLC source caveats, Modbus warnings, ladder-graph notes) that makes them practically useful. Accepted cost: when a meta-framework principle in one of those rules evolves, both plugin copies must be updated.

The skill `generate-development-local` moved by the same test: the neutralized common skill reads the consuming domain plugin's `docs/templates/DEVELOPMENT-LOCAL*.md` as `<PLUGIN_TEMPLATE_PATH>`, so the ecosystem-specific values (bench-vs-field, serial-port path, etc.) flow through naturally without the skill body needing to encode them.

### Marketplace portability (confirmed)

| Concern | Public-baseline status | Evidence |
|---|---|---|
| Inter-plugin dependency in `plugin.json` | NOT used. README-level "install alongside X" only. | Cursor loader source: no `dependsOn` / `requires` / `recommends` field is consumed. The published marketplace plugins (Elastic, Figma, Prisma) confirm — none declares one. See § 5 below. |
| 4th plugin individually publishable | Yes — same `.cursor-plugin/plugin.json` shape as the existing three. | Structurally identical to elastic / figma / prisma plugins. |
| `marketplace.json` carries the 4th entry | Yes. | `cursor-plugins/.cursor-plugin/marketplace.json` updated. |
| Name uniqueness for marketplace | `umbraculum-toolset-common` is brand-prefixed; should be globally unique. | § 3.A below — name-availability check deferred to actual submission. |
| Hardcoded paths / user-specific values | Common plugin's neutralized rules have NO hardcoded paths. Per-plugin copies that stayed retain their hardcoded examples; closed when each plugin is individually prepared for marketplace per § 3.F. | This section + § 3.B. |
| "Install Y alongside X" UX in marketplace | Documented in each plugin's description + README. Same UX as today. | Pattern: Elastic plugin's description references Kibana/Cloud companions. |

**Net: the public baseline is marketplace-portable. No future refactor required when we eventually publish.** Per-plugin LICENSE files and a name-availability check are still future work (tracked in § 3.F).

### What's still open

- **Loader filename-collision behavior.** If both `common` and a domain plugin somehow carried `12-skill-contract.mdc` (during a future transition, or by mistake), does Cursor de-dupe by filename across plugins, or load both? The public baseline deliberately removes the duplicate; a follow-up sanity check by temporarily re-adding the file in node-react would settle this. See § 5.
- **Future shared meta-framework rules drift naturally** as the meta-framework evolves. If a rule that today carries substantive ecosystem-specific text loses that text in a refactor, promote it to common at the next opportunity (the in-scope / out-of-scope test lives in `umbraculum-toolset-common/docs/DESIGN-NOTES.md`).

---

## 3. Private plugin vs Cursor marketplace plugin — what changes

Today all four plugins are **private**. If we ever want to publish any of them to the official Cursor marketplace, here's the gap we'd need to close.

### A. Manifest schema

| Concern | Private plugin (today) | Marketplace plugin |
|---|---|---|
| `plugin.json` required fields | Cursor loads what's there; permissive | Stricter validation — `name`, `version`, `description`, `author`, `license`, possibly `homepage`, `repository`, `icon` may be required |
| `version` format | Free-form (we use SemVer by convention) | SemVer almost certainly required; pre-release suffixes may have specific rules |
| `name` uniqueness | Local — no collision risk | Globally unique across marketplace; need to check name availability |
| `author` field | Free-form (we use `"umbraculum-toolset"`) | Likely requires a verified identity (account or organization) |
| `license` | Implicit / unwritten | Required SPDX identifier (e.g. `MIT`, `Apache-2.0`, `CC-BY-4.0`); license file in plugin root expected |
| `description` length | No enforcement | Likely a soft cap (the marketplace UI truncates) |

### B. Content hygiene

| Concern | Private (today) | Marketplace |
|---|---|---|
| Absolute local paths | OK if labeled `Example:` | Forbidden; must be relative or env-driven |
| User-specific paths (`/home/rf/dkprojects/…`) | Present in our skill bodies / subagent examples | Must be removed or templated |
| Project-specific names (`brewery`, `umbraculum-dev`, vessel IDs `F1`/`F2`/`B1`) | OK in umbraculum plugins | Domain plugins like `umbraculum-platform-tsjs-cursor-assistant` and `umbraculum-openplc-python-cursor-assistant` would be **non-marketable as-is** — they encode our project specifics. Only `umbraculum-node-react-cursor-assistant` and `umbraculum-toolset-common` are generic enough to consider |
| Secrets / tokens / private URLs | Already forbidden by our policy | Forbidden + actively scanned by marketplace tooling |
| Trademarks / brand names | Used loosely (`Tamagui`, `Prisma`, `Magento`) | OK to reference; not OK to imply official endorsement |

### C. Distribution mechanics

| Concern | Private (today) | Marketplace |
|---|---|---|
| Install mechanism | Local folder path or Git URL pasted into Cursor | Marketplace UI: one-click install |
| Update mechanism | Manual `git pull` + reload in Cursor | Automatic update on plugin republish (semver-respecting) |
| Versioning friction | Bump `version` field, tag in Git, hope consumers pull | Bump + publish; marketplace handles fan-out |
| Discoverability | Zero (you have to know the path / URL) | Marketplace search / categories / featured lists |
| Telemetry / install count | None | Marketplace likely provides install + active-install metrics |
| Revocation | Edit consumers' install lists manually | Pull / yank from marketplace |

### D. Quality bars (likely marketplace-imposed, exact details TBD)

- Smoke-test documented and reproducible.
- README has install + usage + a screenshot or example outcome.
- No "TODO"/"FIXME"/`<XXX>` placeholders in rule/skill bodies.
- All cross-references resolve (no broken links in plugin docs).
- The plugin's rules are scoped via `globs` rather than `alwaysApply: true` wherever possible (every always-on rule increases Cursor's context cost for every prompt of every consumer; the marketplace likely scrutinizes always-on rule count).
- Author has a public-facing way to receive bug reports / PRs (a GitHub repo).

### E. Which of our 4 plugins are marketplace-realistic?

| Plugin | Marketplace-ready? | Why |
|---|---|---|
| `umbraculum-toolset-common` | **Plausible** | Pure meta-framework, no project specifics (the three rules and one skill were neutralized before the public baseline; see § 2). If we ever publish anything to marketplace, this is the most generic. Caveat: the meta-framework concepts (Skill Contract, generate-development-local skill, DEVELOPMENT-LOCAL gate) are our framing; marketplace consumers may expect alternative naming or stricter formalization |
| `umbraculum-node-react-cursor-assistant` | **Plausible** with cleanup | The genuinely generic TS/JS one. Would need: hardcoded `umbraculum-toolset` author switched (or kept as a personal-brand plugin), Magento-residue rules audited (some `umbraculum-node-react-cursor-assistant` rules originated in the dual-plugin source and may carry Magento-shaped assumptions), README rewritten to drop the "companion of `umbraculum-platform-tsjs-cursor-assistant`" framing, license file added. Marketplace listing description would point at `umbraculum-toolset-common` as a companion (same "install alongside X" pattern Elastic uses) |
| `umbraculum-platform-tsjs-cursor-assistant` | **No** (project-specific) | Encodes our 4-slice foundation-hardening narrative, the `@brewery/*` → `@umbraculum/*` rename, our multi-tenant workspace-scoped routing pattern. Useless to anyone outside umbraculum-platform projects |
| `umbraculum-openplc-python-cursor-assistant` | **Borderline** | The PLC variable-prefix convention + OpenPLC reload + `PI_*` Modbus contract patterns are common enough across OpenPLC users that a generalized version could be marketable. But the current rule bodies cite our specific FB names (`FB_CoolingVesselEval`), persona IDs, and vessel IDs (`F1/F2/F3/B1`). Generalization is doable but is a separate rewrite |

### F. Concrete blockers to close before any marketplace submission

1. Pick the target plugin (likely `umbraculum-node-react-cursor-assistant` first).
2. Audit for hardcoded paths and project-specific names — sweep all rules, skills, agents, READMEs.
3. Add a `LICENSE` file (MIT or Apache-2.0 are the usual defaults for tooling plugins).
4. Move the plugin's git history into a public GitHub repo (private plugins can live in any private repo; marketplace plugins typically want a public source).
5. Verify the plugin name is marketplace-unique. All four public-baseline plugin names are brand-prefixed by construction, but verify at submission time.
6. Run a clean smoke-test against 2-3 representative projects that aren't ours.
7. Verify Cursor's current marketplace submission process — likely a form / PR / API call.

These are **not** in scope for the current refactor; they're future work to scope if we ever decide to submit.

---

## 4. TODO list (concrete actions, by priority)

### Now / next session

- [ ] **Loader filename-collision smoke test**: temporarily re-add (under a throwaway tmp folder) a copy of `12-skill-contract.mdc` in `umbraculum-node-react-cursor-assistant/rules/`, reload, grep `Cursor Plugins.log` for any duplicate-rule warning or de-dup log line. Document the result here; remove the throwaway copy.
- [ ] **After each Cursor update, re-test the symlink-loader bug** (see §1b). Repro: replace one of the four plugin entries under `~/.cursor/plugins/local/` with a symlink to its source, Reload Window, grep `Cursor Plugins.log` for `loadUserLocalPlugin <name> loaded`. If it appears, the bug is fixed — retire `cursor-plugins/scripts/install-local.sh` and revert the README to a clean `ln -s` recipe. Until then, the rsync workaround is mandatory.

### When a trigger fires (future common-plugin growth)

- [ ] **Promote additional rules to common as they qualify under Strategy C.** If a rule that today carries substantive ecosystem-specific text loses that text in a refactor (e.g. an OpenPLC-specific anti-pattern in `14-subagent-contract.mdc` becomes obsolete), re-audit it against the in-scope test in `umbraculum-toolset-common/docs/DESIGN-NOTES.md` and promote. The cost is a release that bumps all four plugin versions in lockstep.

### Long-term / aspirational

- [ ] **Create a cleaner GitHub identity for umbraculum-dev work.** Currently `umbraculum-dev/umbraculum-toolset` pushes authenticate via the `rfumb` GitHub user account's SSH key (previously `romeof1980` before the 2026-05-18 username rename), and the commit author email `umbraculum-dev@proton.me` is registered as a verified secondary email on the `rfumb` account. That works — commit avatars link to `rfumb` — but it conflates two identities that should be separable. Cleaner future state: a dedicated `umbraculum-dev` GitHub **user** account with its own SSH key; `umbraculum-dev@proton.me` moves from `rfumb`'s verified emails to `umbraculum-dev`'s primary email; `~/.ssh/config` adds a `Host github.com-umbraculum-dev` alias with a dedicated `IdentityFile`; the umbraculum-toolset remote is rewritten to use the alias (`git@github.com-umbraculum-dev:umbraculum-dev/umbraculum-toolset.git`). Net effect: pushes attribute to `umbraculum-dev`, commits attribute to `umbraculum-dev`, no leakage between identities. Estimated effort: 15-30 min once decided to do.
- [ ] **Generalize `umbraculum-node-react-cursor-assistant` for marketplace publication** (see §3.F).
- [ ] **Audit each plugin folder for a per-plugin LICENSE file** before any marketplace submission (the repo-root `LICENSE` covers the monorepo; per-plugin marketplace submissions may require a license file inside each plugin folder).
- [ ] **Document the smoke-test procedure** for each plugin.
- [ ] **If the GitHub repo is ever flipped from private to public**: audit for any path / secret / project-name leakage one last time.

### Cleanup follow-ups (low priority)

- [ ] Audit `umbraculum-node-react-cursor-assistant`'s `13-rule-skill-authoring-gate.mdc` — it's marked `alwaysApply: true` AND has JS/TS globs, which is contradictory. Pick one.

---

## 5. Open questions

- **Closed before public baseline:** ~~Does Cursor support **plugin dependencies** (`plugin.json` field like `dependsOn: ["umbraculum-toolset-common"]`)? Or is dependency handling purely consumer-side (install instructions in README)?~~ **No, Cursor does not support a manifest-level dependency field.** Verified by enumerating the loader's destructure in the unpacked Cursor binary (`/tmp/.mount_CursorrG49So/usr/share/cursor/resources/app/extensions/cursor-agent-exec/dist/main.js`): the loader consumes only `displayName`, `description`, `authorName`, `variablesSchema`, `skills`, `rules`, `agents`, `commands`, `mcpConfig`, `hooks`. No `dependsOn` / `requires` / `recommends` / `extends`. Cross-checked against the published Elastic, Figma, and Prisma marketplace plugins — none declares such a field. Dependency handling is therefore README-level + installer-script-level only, both today and after marketplace publishing (see § 2 "Marketplace portability").
- Does Cursor's plugin loader **de-duplicate rules by filename** across plugins, or load them all regardless? Affects whether a temporary transition window (both common and a domain plugin shipping the same filename) is safe. See § 4's "loader filename-collision smoke test" todo.
- Marketplace submission: invitation-only? Open submission? PR-based? API-based? Verify current state via `cursor.com` or Cursor's docs before doing any prep work in §3.F.
- Plugin `version` format for marketplace: strict SemVer? SemVer with optional pre-release? Date-versioned (`2026.05.18`)?

These questions inform §3 but don't block the public baseline.
