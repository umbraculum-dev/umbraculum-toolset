import { z } from "zod";

const WorkspaceEntrySchema = z.object({
  path: z.string().min(1),
  mode: z.enum(["npm", "tsc"]).default("npm"),
});

const NestedInstallSchema = z.object({
  path: z.string().min(1),
  command: z.string().min(1),
  afterJob: z.string().min(1),
  beforeJob: z.string().min(1),
});

const DocsReadmesJobSchema = z.object({
  id: z.literal("docs-readmes"),
  containerSetup: z.array(z.string()).default([]),
  commands: z.array(z.string().min(1)).min(1),
});

const LintJobSchema = z.object({
  id: z.literal("lint"),
  command: z.string().min(1),
  needsRootInstall: z.literal(true),
});

const TypecheckJobSchema = z.object({
  id: z.literal("typecheck"),
  workspaces: z.array(WorkspaceEntrySchema).min(1),
  needsRootInstall: z.literal(true),
  needsNestedInstall: z.boolean().default(true),
});

/** npm build/test/pack verify steps shared by publish-sdk-batch GHA (no OIDC). */
const SdkPublishPrepJobSchema = z.object({
  id: z.literal("sdk-publish-prep"),
  needsRootInstall: z.literal(true),
  commands: z.array(z.string().min(1)).min(1),
});

const JobSchema = z.discriminatedUnion("id", [
  DocsReadmesJobSchema,
  LintJobSchema,
  TypecheckJobSchema,
  SdkPublishPrepJobSchema,
]);

const DockerVolumeSchema = z.object({
  name: z.string().min(1),
  containerPath: z.string().min(1),
});

export const CiParityManifestSchema = z.object({
  schemaVersion: z.literal(1),
  profile: z.enum(["ts-npm-monorepo", "python", "magento-php"]),
  runtime: z.object({
    image: z.string().min(1),
    nodeOptions: z.string().optional(),
  }),
  docker: z
    .object({
      volumes: z.array(DockerVolumeSchema).default([]),
    })
    .default({ volumes: [] }),
  snapshot: z.object({
    local: z.literal("git-archive"),
    ci: z.literal("checkout"),
  }),
  install: z.object({
    root: z.string().min(1),
    nested: z.array(NestedInstallSchema).default([]),
  }),
  jobs: z.array(JobSchema).min(1),
});

export type CiParityManifest = z.infer<typeof CiParityManifestSchema>;
export type CiParityJob = z.infer<typeof JobSchema>;
export type WorkspaceEntry = z.infer<typeof WorkspaceEntrySchema>;

export function parseManifest(raw: unknown): CiParityManifest {
  return CiParityManifestSchema.parse(raw);
}
