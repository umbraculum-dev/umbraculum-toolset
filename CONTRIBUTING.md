# Contributing to umbraculum-toolset

Thank you for considering a contribution. This file is the umbrella
contributor guide for the **umbraculum-toolset source repository** —
the commit, sign-off, and PR conventions that apply when you change
files in this repo (rule edits in any of the four plugins under
[`cursor-plugins/`](./cursor-plugins/), tooling updates, infra changes,
docs improvements, etc.).

For **plugin-pack**-specific guidance — what each plugin contains, how
to install them, how the four plugins pair, and how to add a new plugin
or rule — see [`cursor-plugins/README.md`](./cursor-plugins/README.md).
For **per-plugin** marketplace-bound documentation, see each plugin's
own `README.md` under `cursor-plugins/<plugin-name>/`.

This contributor guide and the supporting infrastructure (git hooks,
scripts) live at the **repo root**, well outside any plugin's marketplace
package boundary. **Two distribution channels operate independently**:

- **Contributors** receive this guide and the hook via `git clone https://github.com/umbraculum-dev/umbraculum-toolset.git` — the path you're on if you're reading this file. One-time activation per clone: `git config core.hooksPath scripts/git-hooks` (see [§"What DOES work — the canonical setup"](#what-does-work--the-canonical-setup) below).
- **Marketplace consumers** who install the plugins via Cursor's marketplace (or via the `workspaceOpen` hook + source paths documented in `cursor-plugins/docs/WORKSPACE-PLUGIN-LOADING.md`) receive only the per-plugin payload under `cursor-plugins/<plugin-name>/` — they do NOT get this guide or the maintainer hook script, and don't need them, since they're consuming the rules in their own projects rather than committing to this repo.

In short: the contributor infrastructure does not bloat the marketplace plugins, and the marketplace plugins remain self-contained.

## Developer Certificate of Origin (DCO)

Every commit to this repository must carry a `Signed-off-by:` trailer
asserting that you have the right to contribute the changes under the
project's license (see [`LICENSE`](./LICENSE)). The trailer looks like:

```text
Signed-off-by: Your Name <your.email@example.com>
```

The signing identity must match your `user.name` and `user.email` git
config (commits with mismatched identity are rejected by the DCO check).

### What does NOT work

The single most common DCO misconfiguration in TS/JS-monorepo
contributors' git config is `git config --global format.signOff true`.
This setting applies **only to `git format-patch`**; it does **nothing**
for `git commit`. Do not rely on it. (This trap is documented at length
in `cursor-plugins/umbraculum-toolset-common/rules/42-dco-signoff-gate.mdc`.)

### What DOES work — the canonical setup (recommended)

umbraculum-toolset ships a committed `prepare-commit-msg` hook at
[`scripts/git-hooks/prepare-commit-msg`](./scripts/git-hooks/prepare-commit-msg).
Each clone enables it **once** by pointing git's hook directory at the
committed location:

```bash
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath scripts/git-hooks
```

After that, every `git commit` in this clone auto-receives the
`Signed-off-by:` trailer (read from your `user.name` + `user.email`).

Properties of this setup:

- The hook content is **version-controlled**. Updates propagate via
  normal `git pull`; you never re-paste a heredoc.
- The hook content is **reviewable**. Open
  [`scripts/git-hooks/prepare-commit-msg`](./scripts/git-hooks/prepare-commit-msg)
  to see exactly what runs before each commit; changes go through PR
  review like any other code.
- The hook is a **no-op** if your commit message already contains a
  `Signed-off-by:` trailer, so manual `git commit -s` keeps working
  alongside it without producing duplicate trailers.
- The hook is a **no-op on merge / squash commits** (those carry their
  own trailer aggregation rules).

### Cursor co-author attribution (handled by the same hook)

The hook above also auto-injects a second trailer **when and only when**
`CURSOR_AGENT=1` is exported in the shell environment:

```text
Co-authored-by: Cursor <cursoragent@cursor.com>
```

Cursor exports `CURSOR_AGENT=1` (alongside
`CURSOR_EXTENSION_HOST_ROLE=agent-exec` and other markers; verifiable
with `env | grep -i cursor` from any agent shell) into every tool-call
command its agents invoke. So agent-driven commits get the trailer
automatically; commits typed by a human in their own terminal (no
`CURSOR_AGENT`) correctly receive only `Signed-off-by:` and no
co-author misattribution.

This is the umbraculum project's mechanism for honest AI-assistance
attribution per the umbraculum-dev `MANIFESTO.md` §1.2 (the
AI-orchestrated-code stance). The umbraculum-toolset
**dogfoods this discipline**: the hook here is the reference
implementation of the canonical hook sketch documented in
[`cursor-plugins/umbraculum-toolset-common/rules/44-agent-commit-cursor-coauthor.mdc`](./cursor-plugins/umbraculum-toolset-common/rules/44-agent-commit-cursor-coauthor.mdc),
which is one of the rules this very plugin pack ships to downstream
consumers.

> **Empirical note.** Cursor's git integration **does** sometimes
> pre-inject `Co-authored-by: Cursor` into the commit-message file
> before this hook runs — observed empirically — but the pre-injection
> is **non-deterministic**: it fires on some agent-driven commits and
> not on others, with no documented signal for when it does or doesn't.
> Relying on it alone leads to silently-misattributed commits. **The
> hook is the operational contract** that ensures the trailer is
> consistently present; the Cursor pre-injection — when it fires — is
> additive and idempotent with the hook's
> `git interpret-trailers --if-exists addIfDifferent` semantics. This
> note is repeated where contributors will see it (here, in the hook's
> comment block, in rule 42, and in rule 44) so the non-determinism is
> visible during onboarding rather than discovered as a missing
> attribution after the fact.

### Verifying

After running the canonical setup once, make a no-op commit to verify
both trailers are auto-injected (when committing from a Cursor agent
shell — i.e., the agent making the commit, not a human terminal):

```bash
git commit --allow-empty -m "test: DCO + cursor-coauthor hook smoke test"
git log -1 --format='%(trailers:only=true)'
```

Expected output (order may vary; the second line appears only when
`CURSOR_AGENT=1` is set in the shell):

```text
Signed-off-by: Your Name <your.email@example.com>
Co-authored-by: Cursor <cursoragent@cursor.com>
```

Then `git reset --soft HEAD~1` if you want to discard the test commit.

If the `Co-authored-by:` trailer is missing on a commit you made
through a Cursor agent tool call, the hook's `CURSOR_AGENT=1` branch
did not fire. Check `env | grep CURSOR_AGENT` in the agent's shell;
if the var is unset, this is a Cursor session-state issue (rare). If
the var is set but the trailer is still missing, the hook may be on an
older version that predates the `CURSOR_AGENT=1` injection logic — pull
the latest and re-run the install.

### Alternative mechanisms (fallback)

If for some reason `core.hooksPath` is not available in your
environment (extremely rare; modern git supports it), the fallback
is manual:

- `git commit --signoff` (or `-s`) on every commit — appends the DCO
  trailer.
- `git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"` —
  appends the Cursor co-author trailer (only useful when committing
  through a Cursor agent; humans in plain terminals should NOT add
  this trailer).

These fallbacks are mentioned for completeness; the canonical
`core.hooksPath` setup above is the recommended approach.

## Commit messages

- Use [Conventional Commits](https://www.conventionalcommits.org/)
  prefixes (`feat:`, `fix:`, `docs:`, `chore:`, etc.) and scope when
  helpful (e.g. `feat(toolset-common): add 44-agent-commit-cursor-coauthor rule`).
- Imperative subject ≤ 72 chars.
- Body explains **why**, not just **what**.
- The hook above appends `Signed-off-by:` (and `Co-authored-by: Cursor`
  on agent commits) automatically; you do not need to type either by
  hand.
- For branches with a Jira-style ticket token (e.g.
  `ABC-123-add-rule`), include the token in the commit subject so
  Bitbucket / GitHub / Jira "smart commit" integrations link the
  commit to the matching ticket. See
  [`cursor-plugins/umbraculum-toolset-common/rules/41-commit-message-ticket-prefix.mdc`](./cursor-plugins/umbraculum-toolset-common/rules/41-commit-message-ticket-prefix.mdc)
  for the recommended form.

## Pull requests

- Branch off `master`. Keep PRs focused (one rule add, one rule
  rewrite, one infrastructure change — not all three at once).
- Each PR title should follow the same Conventional Commits convention
  as the underlying commits.
- For plugin version bumps: bump the relevant plugin's
  `cursor-plugins/<plugin-name>/.cursor-plugin/plugin.json` `version`
  field per the established convention (a new rule shipped in
  `umbraculum-toolset-common` gets a minor bump; bug fixes get a patch
  bump). Toolset-level lockstep bumps (across multiple plugins at
  once) are tagged `vX.Y.Z` at the repo root, per
  [`README.md`](./README.md) §"Versioning".
- Plugin-pack-internal review concerns (rule numbering collisions,
  witness-rule contract, etc.) are described in
  [`cursor-plugins/README.md`](./cursor-plugins/README.md).

## Where the canonical authoritative discipline lives

The DCO + Cursor co-author discipline this contributor guide encodes
is itself **published as Cursor rules** in this very plugin pack:

| Rule | What it specifies |
|---|---|
| [`cursor-plugins/umbraculum-toolset-common/rules/42-dco-signoff-gate.mdc`](./cursor-plugins/umbraculum-toolset-common/rules/42-dco-signoff-gate.mdc) | DCO sign-off gate, mechanism comparison, `format.signOff` misconfiguration trap. |
| [`cursor-plugins/umbraculum-toolset-common/rules/44-agent-commit-cursor-coauthor.mdc`](./cursor-plugins/umbraculum-toolset-common/rules/44-agent-commit-cursor-coauthor.mdc) | Agent-side post-commit verification: after every `git commit` from a Cursor agent tool call, verify both trailers via `git log -1 --format='%(trailers:only=true)'`. Includes the canonical hook sketch this repo's `scripts/git-hooks/prepare-commit-msg` implements. |
| [`cursor-plugins/umbraculum-toolset-common/rules/41-commit-message-ticket-prefix.mdc`](./cursor-plugins/umbraculum-toolset-common/rules/41-commit-message-ticket-prefix.mdc) | Ticket-token in commit subject for Bitbucket / GitHub / Jira smart-commit linking. |

The rules and this `CONTRIBUTING.md` document the same discipline at
two layers: human-facing prose (here) and agent-loaded rules (there).
Updates to one should propagate to the other.

## License

By contributing to umbraculum-toolset, you agree that your
contributions are licensed under the [MIT license](./LICENSE) of this
repository.
