import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { CiParityManifest, CiParityJob } from "./manifest.js";

export type JobResult = {
  id: string;
  exitCode: number;
};

export type RunOptions = {
  repoRoot: string;
  manifest: CiParityManifest;
  sha: string;
  ci: boolean;
  keep: boolean;
  jobFilter: string[] | null;
};

export type RunOutput = {
  sha: string;
  shortSha: string;
  snapshotDir: string;
  logDir: string;
  results: JobResult[];
  exitCode: number;
};

function shortSha(repoRoot: string, sha: string): string {
  try {
    return execFileSync("git", ["rev-parse", "--short", sha], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return sha.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 12);
  }
}

export function createSnapshot(repoRoot: string, sha: string): { dir: string; short: string } {
  const short = shortSha(repoRoot, sha);
  const dir = `/tmp/ci-parity-${short}`;
  const tarFile = `/tmp/ci-parity-${short}.tar`;

  if (existsSync(dir)) {
    spawnSync(
      "docker",
      ["run", "--rm", "-v", "/tmp:/host-tmp", "node:20-slim", "rm", "-rf", `/host-tmp/ci-parity-${short}`],
      { stdio: "ignore" },
    );
  }
  rmSync(tarFile, { force: true });

  execFileSync("git", ["archive", sha, "-o", tarFile], { cwd: repoRoot, stdio: "inherit" });
  mkdirSync(dir, { recursive: true });
  execFileSync("tar", ["-xf", tarFile, "-C", dir], { stdio: "inherit" });
  rmSync(tarFile, { force: true });

  return { dir, short };
}

function jobsToRun(manifest: CiParityManifest, filter: string[] | null): CiParityJob[] {
  if (!filter || filter.length === 0) {
    return manifest.jobs;
  }
  const allowed = new Set(filter);
  return manifest.jobs.filter((job) => allowed.has(job.id));
}

function bashVarName(jobId: string, suffix: string): string {
  return `${jobId.replace(/-/g, "_")}_${suffix}`;
}

export function buildContainerScript(
  manifest: CiParityManifest,
  jobs: CiParityJob[],
): string {
  const lines: string[] = [
    "set +e",
    "export PATH=/repo/node_modules/.bin:$PATH",
    "ROOT_INSTALLED=0",
    "",
    "run_root_install() {",
    "  if [ \"$ROOT_INSTALLED\" = \"1\" ]; then return 0; fi",
    `  ${manifest.install.root}`,
    "  rc=$?",
    "  if [ $rc -ne 0 ]; then echo \"FATAL: root install failed (exit $rc)\"; exit 2; fi",
    "  ROOT_INSTALLED=1",
    "}",
    "",
  ];

  const resultVars: string[] = [];

  for (const job of jobs) {
    const rcVar = bashVarName(job.id, "rc");
    lines.push(`echo "[job] ${job.id} ..."`);

    if (job.id === "docs-readmes") {
      for (const setup of job.containerSetup) {
        lines.push(setup);
      }
      lines.push(`: > /repo/.ci-parity-${job.id}.log`);
      lines.push(`${rcVar}=0`);
      for (const cmd of job.commands) {
        lines.push(`${cmd} >> /repo/.ci-parity-${job.id}.log 2>&1`);
        lines.push("cmd_rc=$?");
        lines.push(`if [ $cmd_rc -ne 0 ]; then ${rcVar}=$cmd_rc; fi`);
      }
    } else if (job.id === "lint") {
      lines.push("run_root_install");
      lines.push(`: > /repo/.ci-parity-${job.id}.log`);
      lines.push(`${job.command} >> /repo/.ci-parity-${job.id}.log 2>&1`);
      lines.push(`${rcVar}=$?`);
    } else if (job.id === "typecheck") {
      lines.push("run_root_install");
      if (job.needsNestedInstall) {
        for (const nested of manifest.install.nested) {
          if (nested.afterJob === "lint" && nested.beforeJob === "typecheck") {
            lines.push(
              `(cd /repo/${nested.path} && ${nested.command}) >> /repo/.ci-parity-install.log 2>&1`,
            );
            lines.push("if [ $? -ne 0 ]; then echo \"FATAL: nested install failed\"; exit 2; fi");
          }
        }
      }
      lines.push(`: > /repo/.ci-parity-${job.id}.log`);
      lines.push("failed_ws=()");
      for (const ws of job.workspaces) {
        lines.push(`cd /repo/${ws.path}`);
        if (ws.mode === "tsc") {
          lines.push(
            `/repo/node_modules/.bin/tsc -p tsconfig.json --noEmit >> /repo/.ci-parity-${job.id}.log 2>&1`,
          );
        } else {
          lines.push(`npm run typecheck --silent >> /repo/.ci-parity-${job.id}.log 2>&1`);
        }
        lines.push("rc=$?");
        lines.push(`if [ $rc -ne 0 ]; then failed_ws+=("${ws.path}"); fi`);
        lines.push("cd /repo");
      }
      lines.push(
        `if [ \${#failed_ws[@]} -eq 0 ]; then ${rcVar}=0; else ${rcVar}=1; fi`,
      );
    } else if (job.id === "sdk-publish-prep") {
      lines.push("run_root_install");
      lines.push(`: > /repo/.ci-parity-${job.id}.log`);
      lines.push(`${rcVar}=0`);
      for (const cmd of job.commands) {
        lines.push(`${cmd} >> /repo/.ci-parity-${job.id}.log 2>&1`);
        lines.push("cmd_rc=$?");
        lines.push(`if [ $cmd_rc -ne 0 ]; then ${rcVar}=$cmd_rc; fi`);
      }
    }

    lines.push(`echo "  exit: $${rcVar}"`);
    resultVars.push(rcVar);
    lines.push("");
  }

  lines.push(": > /repo/.ci-parity-status");
  for (const varName of resultVars) {
    lines.push(`echo -n "$${varName} " >> /repo/.ci-parity-status`);
  }
  lines.push('echo "" >> /repo/.ci-parity-status');

  lines.push("overall=0");
  for (const varName of resultVars) {
    lines.push(`if [ $${varName} -ne 0 ]; then overall=1; fi`);
  }
  lines.push("exit $overall");

  return lines.join("\n");
}

/** Docker `-v name:path` pairs from manifest `docker.volumes` (local warm-cache persistence). */
export function dockerVolumeArgs(manifest: CiParityManifest): string[] {
  const args: string[] = [];
  for (const vol of manifest.docker.volumes) {
    args.push("-v", `${vol.name}:${vol.containerPath}`);
  }
  return args;
}

export function runCiParity(options: RunOptions): RunOutput {
  const jobs = jobsToRun(options.manifest, options.jobFilter);
  if (jobs.length === 0) {
    throw new Error("No jobs selected — check --jobs filter against manifest job ids");
  }

  const short = shortSha(options.repoRoot, options.sha);
  let snapshotDir: string;

  if (options.ci) {
    snapshotDir = resolve(options.repoRoot);
  } else {
    const snap = createSnapshot(options.repoRoot, options.sha);
    snapshotDir = snap.dir;
  }

  const logDir = `${snapshotDir}.logs`;
  mkdirSync(logDir, { recursive: true });

  const containerScript = buildContainerScript(options.manifest, jobs);
  const scriptPath = join(snapshotDir, ".ci-parity-run.sh");
  writeFileSync(scriptPath, `#!/usr/bin/env bash\n${containerScript}\n`, "utf8");

  const dockerArgs = [
    "run",
    "--rm",
    "-v",
    `${snapshotDir}:/repo`,
    "-w",
    "/repo",
    ...dockerVolumeArgs(options.manifest),
  ];

  if (options.manifest.runtime.nodeOptions) {
    dockerArgs.push("-e", `NODE_OPTIONS=${options.manifest.runtime.nodeOptions}`);
  }

  dockerArgs.push(options.manifest.runtime.image, "bash", "/repo/.ci-parity-run.sh");

  console.log(`=== @umbraculum/ci-parity — running against ${options.sha} (${short}) ===`);
  console.log(`snapshot: ${snapshotDir}`);
  console.log(`jobs: ${jobs.map((j) => j.id).join(", ")}`);
  console.log("");

  const dockerResult = spawnSync("docker", dockerArgs, { stdio: "inherit", encoding: "utf8" });

  const results: JobResult[] = [];
  const statusPath = join(snapshotDir, ".ci-parity-status");
  if (existsSync(statusPath)) {
    const parts = readFileSync(statusPath, "utf8").trim().split(/\s+/);
    jobs.forEach((job, index) => {
      const code = Number(parts[index] ?? "1");
      results.push({ id: job.id, exitCode: Number.isNaN(code) ? 1 : code });

      const logSource = join(snapshotDir, `.ci-parity-${job.id}.log`);
      const logDest = join(logDir, `${job.id}.log`);
      if (existsSync(logSource)) {
        execFileSync("cp", ["-f", logSource, logDest]);
      }
    });
  } else {
    for (const job of jobs) {
      results.push({ id: job.id, exitCode: 1 });
    }
  }

  const exitCode = dockerResult.status ?? 1;

  console.log("");
  console.log("=== @umbraculum/ci-parity — summary ===");
  const summaryParts = results.map((r) => `${r.id}=${r.exitCode === 0 ? "OK" : "FAIL"}`);
  console.log(`CI-PARITY-CHECK ${short}: ${summaryParts.join(" ")}`);
  for (const r of results) {
    const status = r.exitCode === 0 ? "OK  " : "FAIL";
    console.log(`  ${r.id.padEnd(14)}: ${status}  (log: ${logDir}/${r.id}.log)`);
  }
  console.log("");

  if (!options.keep && !options.ci) {
    spawnSync(
      "docker",
      [
        "run",
        "--rm",
        "-v",
        "/tmp:/host-tmp",
        "node:20-slim",
        "rm",
        "-rf",
        `/host-tmp/ci-parity-${short}`,
        `/host-tmp/ci-parity-${short}.logs`,
      ],
      { stdio: "ignore" },
    );
  } else if (options.keep) {
    console.log(`--- snapshot kept at ${snapshotDir} (logs at ${logDir}) ---`);
  }

  return {
    sha: options.sha,
    shortSha: short,
    snapshotDir,
    logDir,
    results,
    exitCode,
  };
}

export function defaultManifestPath(repoRoot: string): string {
  return join(repoRoot, ".umbraculum", "ci-parity.json");
}
