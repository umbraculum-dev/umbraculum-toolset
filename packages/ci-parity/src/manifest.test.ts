import { describe, expect, it } from "vitest";

import { parseManifest } from "./manifest.js";
import { buildContainerScript, dockerVolumeArgs } from "./runner.js";

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

  it("runs dogfood-npm-smoke without root install", () => {
    const manifest = parseManifest({
      ...sampleManifest,
      jobs: [
        {
          id: "dogfood-npm-smoke",
          commands: ["./scripts/dogfood-npm-smoke.sh"],
        },
      ],
    });
    const script = buildContainerScript(manifest, manifest.jobs);
    const jobBlock = script.split("[job] dogfood-npm-smoke")[1]?.split("\n\n")[0] ?? "";
    expect(script).toContain("[job] dogfood-npm-smoke");
    expect(script).toContain("./scripts/dogfood-npm-smoke.sh");
    expect(jobBlock).not.toMatch(/\nrun_root_install\n/);
  });

  it("includes run_root_install before sdk-publish-prep commands", () => {
    const manifest = parseManifest({
      ...sampleManifest,
      jobs: [
        ...sampleManifest.jobs,
        {
          id: "sdk-publish-prep",
          needsRootInstall: true,
          commands: ["npm run build:packages", "npm pack -w @umbraculum/ai-tool-sdk --dry-run"],
        },
      ],
    });
    const script = buildContainerScript(manifest, [manifest.jobs[manifest.jobs.length - 1]!]);
    expect(script).toContain("run_root_install");
    expect(script).toContain("[job] sdk-publish-prep");
    expect(script).toContain("npm pack -w @umbraculum/ai-tool-sdk --dry-run");
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

  it("defaults docker.volumes to empty", () => {
    const manifest = parseManifest({
      schemaVersion: 1,
      profile: "ts-npm-monorepo",
      runtime: { image: "node:20-slim" },
      snapshot: { local: "git-archive", ci: "checkout" },
      install: { root: "npm ci", nested: [] },
      jobs: [
        {
          id: "lint",
          command: "npm run lint",
          needsRootInstall: true,
        },
      ],
    });
    expect(manifest.docker.volumes).toEqual([]);
    expect(dockerVolumeArgs(manifest)).toEqual([]);
  });

  it("maps docker.volumes to docker -v args", () => {
    const manifest = parseManifest({
      schemaVersion: 1,
      profile: "ts-npm-monorepo",
      runtime: { image: "node:20-slim" },
      docker: {
        volumes: [
          { name: "umbraculum_npm_cache", containerPath: "/root/.npm" },
          { name: "umbraculum_root_node_modules", containerPath: "/repo/node_modules" },
        ],
      },
      snapshot: { local: "git-archive", ci: "checkout" },
      install: { root: "npm ci", nested: [] },
      jobs: [
        {
          id: "lint",
          command: "npm run lint",
          needsRootInstall: true,
        },
      ],
    });
    expect(dockerVolumeArgs(manifest)).toEqual([
      "-v",
      "umbraculum_npm_cache:/root/.npm",
      "-v",
      "umbraculum_root_node_modules:/repo/node_modules",
    ]);
  });
});
