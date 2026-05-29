import { describe, expect, it } from "vitest";

import { parseManifest } from "./manifest.js";
import { buildContainerScript } from "./runner.js";

const sampleManifest = parseManifest({
  schemaVersion: 1,
  profile: "ts-npm-monorepo",
  runtime: { image: "node:20-slim", nodeOptions: "--max-old-space-size=6144" },
  snapshot: { local: "git-archive", ci: "checkout" },
  install: {
    root: "npm ci --no-audit --no-fund --workspaces --include-workspace-root",
    nested: [
      {
        path: "apps/web/e2e",
        command: "npm ci --no-audit --no-fund",
        afterJob: "lint",
        beforeJob: "typecheck",
      },
    ],
  },
  jobs: [
    {
      id: "docs-readmes",
      containerSetup: ["apt-get update -qq", "apt-get install -y -qq python3"],
      commands: ["python3 scripts/docs/check-readmes.py"],
    },
    {
      id: "lint",
      command: "npm run lint",
      needsRootInstall: true,
    },
    {
      id: "typecheck",
      needsRootInstall: true,
      needsNestedInstall: true,
      workspaces: [{ path: "packages/contracts", mode: "npm" }],
    },
  ],
});

describe("buildContainerScript", () => {
  it("includes lint before nested e2e install", () => {
    const script = buildContainerScript(sampleManifest, sampleManifest.jobs);
    const lintPos = script.indexOf("[job] lint");
    const nestedPos = script.indexOf("apps/web/e2e");
    const typecheckPos = script.indexOf("[job] typecheck");
    expect(lintPos).toBeGreaterThan(-1);
    expect(typecheckPos).toBeGreaterThan(lintPos);
    expect(nestedPos).toBeGreaterThan(typecheckPos);
  });
});

describe("parseManifest", () => {
  it("rejects unknown schema version", () => {
    expect(() =>
      parseManifest({
        schemaVersion: 2,
        profile: "ts-npm-monorepo",
        runtime: { image: "node:20-slim" },
        snapshot: { local: "git-archive", ci: "checkout" },
        install: { root: "npm ci", nested: [] },
        jobs: [],
      }),
    ).toThrow();
  });
});
