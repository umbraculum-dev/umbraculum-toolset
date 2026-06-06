#!/usr/bin/env node
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defaultManifestPath, runCiParity } from "./runner.js";
import { explainManifest, loadManifestFile, validateManifest } from "./validate.js";

type ParsedArgs = {
  command: "run" | "validate" | "explain" | "help";
  repoRoot: string;
  manifestPath: string;
  sha: string;
  ci: boolean;
  keep: boolean;
  strict: boolean;
  jobs: string[] | null;
  parallel: boolean;
  isolatedInstall: boolean;
};

function printHelp(): void {
  console.log(`@umbraculum/ci-parity — CI static-analysis parity runner

Usage:
  ci-parity [run] [options]     Run jobs from manifest (default)
  ci-parity validate [options]  Validate manifest + repo layout
  ci-parity explain [options]   Print manifest execution plan

Options:
  --manifest <path>   Manifest path (default: .umbraculum/ci-parity.json)
  --repo <path>       Repository root (default: cwd)
  --sha <ref>         Git ref for git-archive snapshot (default: HEAD)
  --ci                CI mode: use checkout mount instead of git archive
  --jobs <a,b,c>      Comma-separated job ids subset
  --parallel          Run each job in a separate container (requires --jobs or subset)
  --isolated-install  Skip shared /repo/node_modules volume (safe for --parallel)
  --keep              Keep /tmp/ci-parity-* snapshot and logs
  --strict            validate: fail on undocumented nested workspaces
  -h, --help          Show help

Host prerequisites: git, bash, Docker (jobs run inside manifest runtime image).
`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = [...argv];
  let command: ParsedArgs["command"] = "run";
  if (args[0] === "validate" || args[0] === "explain" || args[0] === "run" || args[0] === "help") {
    command = args[0] === "help" ? "help" : args[0];
    args.shift();
  }
  if (args[0] === "help" || args.includes("-h") || args.includes("--help")) {
    command = "help";
  }

  const repoRoot = resolve(process.cwd());
  let manifestPath = defaultManifestPath(repoRoot);
  let sha = "HEAD";
  let ci = false;
  let keep = false;
  let strict = false;
  let jobs: string[] | null = null;
  let parallel = false;
  let isolatedInstall = false;
  let explicitRepo: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--manifest" && args[i + 1]) {
      manifestPath = resolve(args[++i] ?? manifestPath);
    } else if (arg === "--repo" && args[i + 1]) {
      explicitRepo = resolve(args[++i] ?? repoRoot);
    } else if (arg === "--sha" && args[i + 1]) {
      sha = args[++i] ?? sha;
    } else if (arg === "--ci") {
      ci = true;
    } else if (arg === "--keep") {
      keep = true;
    } else if (arg === "--strict") {
      strict = true;
    } else if (arg === "--jobs" && args[i + 1]) {
      jobs = (args[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--parallel") {
      parallel = true;
    } else if (arg === "--isolated-install") {
      isolatedInstall = true;
    }
  }

  const root = explicitRepo ?? repoRoot;
  if (!manifestPath.startsWith("/")) {
    manifestPath = resolve(root, manifestPath);
  }

  return {
    command,
    repoRoot: root,
    manifestPath,
    sha,
    ci,
    keep,
    strict,
    jobs,
    parallel,
    isolatedInstall,
  };
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.command === "help") {
    printHelp();
    process.exit(0);
  }

  if (!existsSync(parsed.manifestPath)) {
    console.error(`ERROR: manifest not found: ${parsed.manifestPath}`);
    process.exit(2);
  }

  const manifest = loadManifestFile(parsed.manifestPath);

  if (parsed.command === "explain") {
    console.log(explainManifest(manifest));
    process.exit(0);
  }

  if (parsed.command === "validate") {
    const result = validateManifest({
      repoRoot: parsed.repoRoot,
      manifest,
      strict: parsed.strict,
    });
    for (const w of result.warnings) {
      console.warn(`WARN: ${w}`);
    }
    if (result.ok) {
      console.log("ci-parity validate: OK");
      process.exit(0);
    }
    for (const e of result.errors) {
      console.error(`ERROR: ${e}`);
    }
    process.exit(1);
  }

  const output = await runCiParity({
    repoRoot: parsed.repoRoot,
    manifest,
    sha: parsed.sha,
    ci: parsed.ci,
    keep: parsed.keep,
    jobFilter: parsed.jobs,
    parallel: parsed.parallel,
    isolatedInstall: parsed.isolatedInstall,
  });

  process.exit(output.exitCode);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(2);
});
