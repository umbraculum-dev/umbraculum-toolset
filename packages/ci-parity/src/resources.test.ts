import { describe, expect, it } from "vitest";

import {
  clampNodeOptionsHeap,
  dockerMemoryToApproxMiB,
  dockerResourceArgs,
  heapCapForMemory,
  mapPool,
  parseMaxOldSpaceSizeMb,
  resolveDockerResources,
} from "./resources.js";

describe("resolveDockerResources", () => {
  it("uses laptop caps by default (no CI env)", () => {
    const r = resolveDockerResources({
      env: {},
      manifestNodeOptions: "--max-old-space-size=6144",
    });
    expect(r.profile).toBe("laptop");
    expect(r.memory).toBe("2560m");
    expect(r.cpus).toBe("2");
    expect(r.maxParallel).toBe(2);
    expect(parseMaxOldSpaceSizeMb(r.nodeOptions)).toBe(2048);
  });

  it("uses ci profile under GITHUB_ACTIONS", () => {
    const r = resolveDockerResources({
      env: { GITHUB_ACTIONS: "true" },
      manifestNodeOptions: "--max-old-space-size=6144",
    });
    expect(r.profile).toBe("ci");
    expect(r.memory).toBe("6144m");
    expect(r.cpus).toBeNull();
    expect(r.maxParallel).toBe(8);
    // 6144m cgroup leaves ~512 MiB headroom → heap 5632
    expect(parseMaxOldSpaceSizeMb(r.nodeOptions)).toBe(5632);
  });

  it("honors CI_PARITY_NO_RESOURCE_LIMITS", () => {
    const r = resolveDockerResources({
      env: { CI_PARITY_NO_RESOURCE_LIMITS: "1" },
      manifestNodeOptions: "--max-old-space-size=6144",
    });
    expect(r.profile).toBe("unlimited");
    expect(r.memory).toBeNull();
    expect(r.cpus).toBeNull();
    expect(r.maxParallel).toBe(Number.POSITIVE_INFINITY);
    expect(r.nodeOptions).toBe("--max-old-space-size=6144");
  });

  it("honors env memory/cpus/maxParallel overrides", () => {
    const r = resolveDockerResources({
      env: {
        CI_PARITY_DOCKER_MEMORY: "3g",
        CI_PARITY_DOCKER_CPUS: "1.5",
        CI_PARITY_MAX_PARALLEL: "1",
      },
      manifestNodeOptions: "--max-old-space-size=6144",
    });
    expect(r.profile).toBe("custom");
    expect(r.memory).toBe("3g");
    expect(r.cpus).toBe("1.5");
    expect(r.maxParallel).toBe(1);
    // 3g ≈ 3072 MiB → heap cap 3072-512 = 2560, but laptop base heap is 2048
    expect(parseMaxOldSpaceSizeMb(r.nodeOptions)).toBe(2048);
  });
});

describe("helpers", () => {
  it("parses docker memory strings", () => {
    expect(dockerMemoryToApproxMiB("2560m")).toBe(2560);
    expect(dockerMemoryToApproxMiB("2.5g")).toBe(2560);
  });

  it("clamps NODE_OPTIONS heap", () => {
    expect(clampNodeOptionsHeap("--max-old-space-size=6144", 2048)).toBe(
      "--max-old-space-size=2048",
    );
    expect(clampNodeOptionsHeap(undefined, 2048)).toBe("--max-old-space-size=2048");
  });

  it("heapCapForMemory leaves headroom", () => {
    expect(heapCapForMemory("2560m", 4096)).toBe(2048);
  });

  it("dockerResourceArgs emits memory-swap hard cap", () => {
    expect(
      dockerResourceArgs({
        memory: "2560m",
        cpus: "2",
        maxParallel: 2,
        nodeOptions: undefined,
        profile: "laptop",
      }),
    ).toEqual(["--memory", "2560m", "--memory-swap", "2560m", "--cpus", "2"]);
  });

  it("mapPool respects concurrency and order", async () => {
    const seen: number[] = [];
    const out = await mapPool([1, 2, 3, 4], 2, async (n) => {
      seen.push(n);
      await new Promise((r) => setTimeout(r, 5));
      return n * 10;
    });
    expect(out).toEqual([10, 20, 30, 40]);
    expect(seen.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });
});
