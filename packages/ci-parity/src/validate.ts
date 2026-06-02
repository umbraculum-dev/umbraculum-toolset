import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { CiParityManifestSchema, type CiParityManifest } from "./manifest.js";

export type ValidateOptions = {
  repoRoot: string;
  manifest: CiParityManifest;
  strict: boolean;
};

export type ValidateResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function loadManifestFile(path: string): CiParityManifest {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return CiParityManifestSchema.parse(raw);
}

function findNestedPackageJsonDirs(repoRoot: string, maxDepth = 4): string[] {
  const found: string[] = [];
  const rootPkg = join(repoRoot, "package.json");
  if (!statSync(rootPkg).isFile()) {
    return found;
  }

  const walk = (dir: string, depth: number, rel: string): void => {
    if (depth > maxDepth) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;
      const relPath = rel ? `${rel}/${name}` : name;
      const pkgPath = join(full, "package.json");
      try {
        if (statSync(pkgPath).isFile() && relPath.includes("/")) {
          found.push(relPath);
        }
      } catch {
        // no package.json
      }
      walk(full, depth + 1, relPath);
    }
  };

  for (const top of ["apps", "packages", "services", "docs-site"]) {
    const topDir = join(repoRoot, top);
    try {
      if (statSync(topDir).isDirectory()) {
        walk(topDir, 1, top);
      }
    } catch {
      // missing
    }
  }

  return found;
}

/** Paths like apps/web/e2e — not matched by root workspaces: ["apps/*", "services/*", "packages/*"]. */
function isOutsideRootWorkspacesGlob(relPath: string): boolean {
  const parts = relPath.split("/");
  if (parts.length < 3) {
    return false;
  }
  const top = parts[0];
  if (top !== "apps" && top !== "services" && top !== "packages") {
    return parts.length >= 2;
  }
  return parts.length >= 3;
}

export function validateManifest(options: ValidateOptions): ValidateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const jobIds = new Set(options.manifest.jobs.map((j) => j.id));
  if (jobIds.size !== options.manifest.jobs.length) {
    errors.push("duplicate job ids in manifest");
  }

  for (const nested of options.manifest.install.nested) {
    if (!jobIds.has(nested.afterJob as "lint")) {
      warnings.push(`nested install afterJob=${nested.afterJob} is not a manifest job id`);
    }
    if (!jobIds.has(nested.beforeJob as "typecheck")) {
      warnings.push(`nested install beforeJob=${nested.beforeJob} is not a manifest job id`);
    }
    const nestedPkg = join(options.repoRoot, nested.path, "package.json");
    try {
      statSync(nestedPkg);
    } catch {
      errors.push(`nested install path missing package.json: ${nested.path}`);
    }
  }

  for (const job of options.manifest.jobs) {
    if (job.id === "typecheck") {
      for (const ws of job.workspaces) {
        const wsPath = join(options.repoRoot, ws.path);
        try {
          statSync(wsPath);
        } catch {
          errors.push(`typecheck workspace path not found: ${ws.path}`);
        }
        if (ws.mode === "tsc") {
          const tsconfig = join(wsPath, "tsconfig.json");
          try {
            statSync(tsconfig);
          } catch {
            errors.push(`typecheck tsc mode requires tsconfig.json: ${ws.path}`);
          }
        }
      }
    }
    if (job.id === "docs-readmes") {
      for (const cmd of job.commands) {
        const tokens = cmd.trim().split(/\s+/);
        const script = tokens.find((t) => t.endsWith(".py"));
        if (script) {
          const scriptPath = join(options.repoRoot, script);
          try {
            statSync(scriptPath);
          } catch {
            errors.push(`docs-readmes command target not found: ${script}`);
          }
        }
      }
    }
  }

  if (options.strict) {
    const documented = new Set(options.manifest.install.nested.map((n) => n.path));
    const nestedDirs = findNestedPackageJsonDirs(options.repoRoot);
    for (const dir of nestedDirs) {
      if (!documented.has(dir) && isOutsideRootWorkspacesGlob(dir)) {
        errors.push(
          `strict: nested package.json at ${dir} is not listed in install.nested (mechanism #2)`,
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function explainManifest(manifest: CiParityManifest): string {
  const lines: string[] = [
    `profile: ${manifest.profile}`,
    `runtime.image: ${manifest.runtime.image}`,
    `snapshot.local: ${manifest.snapshot.local}`,
    `snapshot.ci: ${manifest.snapshot.ci}`,
    "",
    "install:",
    `  root: ${manifest.install.root}`,
  ];

  for (const nested of manifest.install.nested) {
    lines.push(
      `  nested: ${nested.path} (after ${nested.afterJob}, before ${nested.beforeJob})`,
    );
  }

  lines.push("", "jobs (in order):");
  for (const job of manifest.jobs) {
    if (job.id === "docs-readmes") {
      lines.push(`  - docs-readmes (${job.commands.length} commands)`);
      for (const cmd of job.commands) {
        lines.push(`      ${cmd}`);
      }
    } else if (job.id === "lint") {
      lines.push(`  - lint: ${job.command}`);
    } else if (job.id === "typecheck") {
      lines.push(`  - typecheck (${job.workspaces.length} workspaces)`);
      for (const ws of job.workspaces) {
        lines.push(`      ${ws.path} [${ws.mode}]`);
      }
    } else if (job.id === "sdk-publish-prep") {
      lines.push(`  - sdk-publish-prep (${job.commands.length} commands)`);
      for (const cmd of job.commands) {
        lines.push(`      ${cmd}`);
      }
    } else if (job.id === "dogfood-npm-smoke") {
      lines.push(`  - dogfood-npm-smoke (${job.commands.length} commands)`);
      for (const cmd of job.commands) {
        lines.push(`      ${cmd}`);
      }
    }
  }

  return lines.join("\n");
}
