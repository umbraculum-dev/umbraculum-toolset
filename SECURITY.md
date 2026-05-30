# Security policy

We take the security of this project seriously. This document explains
how to responsibly disclose vulnerabilities in **umbraculum-toolset**
(Cursor plugins, shared CLI packages, and repo tooling), what is in
scope, and what to expect from us in return.

## Reporting a vulnerability

Please report security issues privately to:

- **Email:** `security@umbraculum.dev` (monitored; routed via Cloudflare Email Routing on `umbraculum.dev`)

If you prefer encrypted email, request our PGP key in your initial
message and we will send it before any sensitive details are exchanged.

When reporting, please include — to the extent you have it — the
following so we can reproduce and triage quickly:

- Affected version, branch, or commit hash (toolset tag, plugin
  `.cursor-plugin/plugin.json` version, or `@umbraculum/ci-parity` npm
  version as applicable).
- A clear description of the issue and the security impact.
- Step-by-step reproduction (URLs, payloads, screenshots, or a minimal
  reproducer).
- Whether the issue is being actively exploited in the wild.

Please **do not** open a public GitHub issue, post to a public chat, or
share details on social media until we have published a fix or agreed
with you on a coordinated disclosure date.

## What to expect from us

- **Acknowledgement:** within 3 business days of your report.
- **Triage and severity:** within 10 business days, including a
  preliminary severity assessment using CVSS v3.1 where applicable.
- **Standard disclosure window:** **90 days** from the date we
  acknowledge a valid report, unless we agree with the reporter on a
  shorter or longer window.
- **Credit:** with your permission, we will credit you in the advisory.
  You may also choose to remain anonymous.

If you do not hear back within the acknowledgement window above, please
re-send your report in case it was filtered or misdelivered.

## Scope

### In scope

- Source under this repository: `cursor-plugins/**` (rules, skills,
  agents, marketplace metadata), `packages/**` (including
  `@umbraculum/ci-parity`), `scripts/**`, and root configuration.
- Published npm packages built from this repo (when applicable).
- Cursor marketplace plugin payloads derived from this repo, including
  instructions or automation that could cause unsafe execution in a
  consumer workspace when the plugin is installed as documented.

### Out of scope

- **Third-party modules and dependencies.** Report those upstream; we
  still accept reports about *how this repo integrates* a vulnerable
  dependency.
- **Security issues in downstream application repos** (for example
  [umbraculum-dev](https://github.com/umbraculum-dev/umbraculum-dev))
  unless the root cause is content shipped from this toolset — report
  those to the application repo's [`SECURITY.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/SECURITY.md).
- **Misconfiguration or misuse in a consumer's own project** when the
  toolset behaved as documented.
- **Social engineering** of maintainers or community members.
- **Findings from automated scanners** with no demonstrated impact.

## Coordinated disclosure

We aim to publish a security advisory in this repository's
`Security` → `Advisories` tab once a fix is available, and to credit
the reporter unless they have asked to remain anonymous.
