/**
 * Docker / parallel resource policy for ci-parity job containers.
 *
 * Local T2-PR can spawn several `--parallel --isolated-install` containers on
 * one laptop. Unbounded heap (e.g. 6 GiB NODE_OPTIONS) × N jobs OOMs the host.
 * GHA reusable workflows run one job set per runner without `--parallel`, so
 * laptop-safe defaults are the critical path for juniors.
 *
 * Overrides (highest wins):
 * - CLI `--max-parallel <n>` (one-shot; see cli.ts → RunOptions.maxParallel)
 * - `CI_PARITY_NO_RESOURCE_LIMITS=1` — omit Docker memory/cpu caps
 * - `CI_PARITY_DOCKER_MEMORY` — e.g. `2560m`, `3g`
 * - `CI_PARITY_DOCKER_CPUS` — e.g. `2`
 * - `CI_PARITY_MAX_PARALLEL` — positive int; concurrent job containers when `--parallel`
 * - manifest `docker.resources.maxParallel`
 */

export type ManifestDockerResources = {
  memory?: string;
  cpus?: string;
  maxParallel?: number;
};

export type ResolvedDockerResources = {
  /** Docker `--memory` value, or null to omit. */
  memory: string | null;
  /** Docker `--cpus` value, or null to omit. */
  cpus: string | null;
  /** Max concurrent job containers under `--parallel`. */
  maxParallel: number;
  /** Effective NODE_OPTIONS (may clamp max-old-space-size). */
  nodeOptions: string | undefined;
  /** Human label for logs. */
  profile: "laptop" | "ci" | "unlimited" | "custom";
};

const LAPTOP_MEMORY = "2560m";
const LAPTOP_CPUS = "2";
const LAPTOP_MAX_PARALLEL = 2;
const LAPTOP_HEAP_MB = 2048;

const CI_MEMORY = "6144m";
const CI_MAX_PARALLEL = 8;
const CI_HEAP_MB = 6144;

function envTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function isCiHost(env: NodeJS.ProcessEnv = process.env): boolean {
  return envTruthy(env["GITHUB_ACTIONS"]) || envTruthy(env["CI"]);
}

/** Parse `--max-old-space-size=N` from NODE_OPTIONS; returns MB or null. */
export function parseMaxOldSpaceSizeMb(nodeOptions: string | undefined): number | null {
  if (!nodeOptions) return null;
  const m = nodeOptions.match(/--max-old-space-size=(\d+)/);
  if (!m?.[1]) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Ensure NODE_OPTIONS has max-old-space-size ≤ heapCapMb (replace or append). */
export function clampNodeOptionsHeap(
  nodeOptions: string | undefined,
  heapCapMb: number,
): string {
  const capped = `--max-old-space-size=${heapCapMb}`;
  if (!nodeOptions || !nodeOptions.trim()) {
    return capped;
  }
  if (/--max-old-space-size=\d+/.test(nodeOptions)) {
    return nodeOptions.replace(/--max-old-space-size=\d+/, capped);
  }
  return `${nodeOptions.trim()} ${capped}`;
}

/** Rough MiB from Docker memory strings like `2560m`, `2.5g`, `3G`. */
export function dockerMemoryToApproxMiB(memory: string): number | null {
  const m = memory.trim().match(/^(\d+(?:\.\d+)?)(m|g|mi|gi)?$/i);
  if (!m?.[1]) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] ?? "m").toLowerCase();
  if (unit === "g" || unit === "gi") return Math.floor(n * 1024);
  return Math.floor(n);
}

/**
 * Heap should stay under cgroup memory (leave ~512 MiB for npm/apt/OS in the container).
 */
export function heapCapForMemory(memory: string | null, fallbackHeapMb: number): number {
  if (!memory) return fallbackHeapMb;
  const mi = dockerMemoryToApproxMiB(memory);
  if (mi == null) return fallbackHeapMb;
  return Math.max(512, Math.min(fallbackHeapMb, mi - 512));
}

export function resolveDockerResources(options: {
  ci?: boolean;
  manifestNodeOptions?: string;
  /** Zod-inferred optional fields may be `string | undefined`; normalize below. */
  manifestResources?: {
    memory?: string | undefined;
    cpus?: string | undefined;
    maxParallel?: number | undefined;
  };
  /** CLI `--max-parallel N` — wins over env and manifest when ≥ 1. */
  cliMaxParallel?: number;
  env?: NodeJS.ProcessEnv;
} = {}): ResolvedDockerResources {
  const env = options.env ?? process.env;
  const ci = options.ci ?? isCiHost(env);

  if (envTruthy(env["CI_PARITY_NO_RESOURCE_LIMITS"])) {
    return {
      memory: null,
      cpus: null,
      maxParallel: Number.POSITIVE_INFINITY,
      nodeOptions: options.manifestNodeOptions,
      profile: "unlimited",
    };
  }

  const baseMemory = ci ? CI_MEMORY : LAPTOP_MEMORY;
  const baseCpus = ci ? null : LAPTOP_CPUS;
  const baseMaxParallel = ci ? CI_MAX_PARALLEL : LAPTOP_MAX_PARALLEL;
  const baseHeap = ci ? CI_HEAP_MB : LAPTOP_HEAP_MB;

  const manifestMemory = options.manifestResources?.memory?.trim();
  const manifestCpus = options.manifestResources?.cpus?.trim();
  const manifestMaxParallel = options.manifestResources?.maxParallel;

  const memory =
    env["CI_PARITY_DOCKER_MEMORY"]?.trim() ||
    (manifestMemory && manifestMemory.length > 0 ? manifestMemory : undefined) ||
    baseMemory;

  const cpusRaw =
    env["CI_PARITY_DOCKER_CPUS"]?.trim() ||
    (manifestCpus && manifestCpus.length > 0 ? manifestCpus : undefined) ||
    baseCpus;
  const cpus = cpusRaw && cpusRaw.length > 0 ? cpusRaw : null;

  let maxParallel = baseMaxParallel;
  const cliMax = options.cliMaxParallel;
  if (cliMax != null && Number.isFinite(cliMax) && cliMax >= 1) {
    maxParallel = Math.floor(cliMax);
  } else if (env["CI_PARITY_MAX_PARALLEL"]?.trim()) {
    const n = Number(env["CI_PARITY_MAX_PARALLEL"].trim());
    if (Number.isFinite(n) && n >= 1) maxParallel = Math.floor(n);
  } else if (
    manifestMaxParallel != null &&
    Number.isFinite(manifestMaxParallel) &&
    manifestMaxParallel >= 1
  ) {
    maxParallel = Math.floor(manifestMaxParallel);
  }

  const heapCap = heapCapForMemory(memory, baseHeap);
  const nodeOptions = clampNodeOptionsHeap(options.manifestNodeOptions, heapCap);

  const custom =
    (cliMax != null && Number.isFinite(cliMax) && cliMax >= 1) ||
    Boolean(env["CI_PARITY_DOCKER_MEMORY"]?.trim()) ||
    Boolean(env["CI_PARITY_DOCKER_CPUS"]?.trim()) ||
    Boolean(env["CI_PARITY_MAX_PARALLEL"]?.trim()) ||
    Boolean(options.manifestResources?.memory) ||
    Boolean(options.manifestResources?.cpus) ||
    options.manifestResources?.maxParallel != null;

  return {
    memory,
    cpus,
    maxParallel,
    nodeOptions,
    profile: custom ? "custom" : ci ? "ci" : "laptop",
  };
}

/** Docker CLI args for resource caps (empty when unlimited). */
export function dockerResourceArgs(resources: ResolvedDockerResources): string[] {
  const args: string[] = [];
  if (resources.memory) {
    args.push("--memory", resources.memory);
    // Keep swap equal to memory so the cgroup hard-caps total RAM+swap pressure.
    args.push("--memory-swap", resources.memory);
  }
  if (resources.cpus) {
    args.push("--cpus", resources.cpus);
  }
  return args;
}

/** Run async work with a concurrency ceiling (stable result order). */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit =
    !Number.isFinite(concurrency) || concurrency >= items.length
      ? items.length
      : Math.max(1, Math.floor(concurrency));
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
