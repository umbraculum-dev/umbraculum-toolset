---
name: zod-schema-scaffold
description: Use this when introducing a new Zod schema in `packages/*-contracts/src/**` or in a Fastify route. Emits the canonical schema template (preprocess + transform + superRefine where appropriate) plus the paired test template that asserts on `ZodError.issues[]` paths via the `expectFirstIssuePathStartsWith` helper. Use proactively after creating a new contract file.
---

# zod-schema-scaffold

Use this skill to scaffold a **canonical** Zod v4 schema in this repo so that all schemas across `packages/*-contracts/` share the same shape conventions (preprocess for backward-compat, transform for soft-tolerance fallbacks, `superRefine` for cross-entry constraints, `z.infer<typeof Schema>` for the inferred type alias, thin `parseX(payload): X` wrapper for legacy API compat).

The skill is a template emitter; it does NOT make architectural decisions. The canonical project decisions are recorded in:

- [`docs/rfcs/0003-validation-library-adoption.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/rfcs/0003-validation-library-adoption.md) — Zod v4 commitment + Decisions A–G.
- [`docs/CONTRACTS-VALIDATION-STRATEGY.md`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/docs/CONTRACTS-VALIDATION-STRATEGY.md) v2.0 — strategy SoT.
- [`packages/contracts/src/auth/meResponse.ts`](https://github.com/umbraculum-dev/umbraculum-dev/blob/master/packages/platform/contracts/src/auth/meResponse.ts) — worked example (PR 1 reference).

## Inputs required (do not assume)

- `<SCHEMA_NAME>` — PascalCase schema constant (e.g. `BrewSessionResponseSchema`).
- `<TARGET_FILE>` — absolute path under `packages/*-contracts/src/**` or `services/api/src/routes/**` where the schema lands.
- `<TYPE_ALIAS>` — PascalCase type alias name (e.g. `BrewSessionResponse`); usually `<SCHEMA_NAME>` minus the `Schema` suffix.
- `<BACK_COMPAT_PAYLOAD_KEYS>` (optional) — list of legacy keys to normalize via `z.preprocess()` (e.g. `["account", "accountId", "activeAccountId"]`); empty if no upstream rename history.
- `<SOFT_TOLERANCE_FIELDS>` (optional) — list of fields that should fall back to `null` / a default when input is malformed (e.g. `["preferredLocale", "preferredTheme"]`); empty if every field is strict.
- `<CROSS_ENTRY_INVARIANTS>` (optional) — short prose description of any cross-entry constraints needing `z.superRefine()` (e.g. "no duplicate names; no duplicate addresses"); empty if none.

## Output format (return exactly)

### Prerequisites

(Brief — confirm `<TARGET_FILE>` is under `packages/*-contracts/src/**` or `services/api/src/routes/**`; confirm `<SCHEMA_NAME>` does not collide with an existing export in the target file; confirm `zod` is listed as a dependency in the target package's `package.json` — if not, the first command lists the package.json so the caller can add the dep.)

### Commands

(The bounded list of commands run, with exit codes. Typically: (1) read the target package's `package.json` to verify the `zod` dep is present; (2) read the target file if it exists to confirm no collision; (3) emit the schema template to stdout; (4) emit the test template to stdout. No writes.)

### Stop conditions

(Any condition that aborted the run, or `(none triggered)` if all commands succeeded.)

### Result

```
SCHEMA <SCHEMA_NAME>: emitted template (N lines)
TEST <SCHEMA_NAME>.test.ts: emitted template (M lines)
```

Plus inline both templates (schema + paired test) in fenced TypeScript blocks. No additional commentary.

## Canonical schema template (skeleton — fill in field shapes from `<SCHEMA_NAME>` requirements)

```typescript
import { z } from "zod";

export const <SCHEMA_NAME> = z.preprocess(
  (raw) => {
    // Backward-compat normalization for <BACK_COMPAT_PAYLOAD_KEYS>.
    // Return `raw` unchanged if no legacy keys present.
    return raw;
  },
  z.object({
    // ... fields here. For soft-tolerance fields, wrap in z.transform()
    // returning the fallback. For cross-entry constraints, chain
    // .superRefine((value, ctx) => { ... ctx.addIssue({ ... }); }).
  }),
);

export type <TYPE_ALIAS> = z.infer<typeof <SCHEMA_NAME>>;

export function parse<TYPE_ALIAS>(payload: unknown): <TYPE_ALIAS> {
  return <SCHEMA_NAME>.parse(payload);
}
```

## Canonical test template (skeleton — fill in field shapes)

```typescript
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { <SCHEMA_NAME>, parse<TYPE_ALIAS> } from "./<basename>";

function expectFirstIssuePathStartsWith(
  value: unknown,
  expectedPathPrefix: ReadonlyArray<string | number>,
): void {
  try {
    <SCHEMA_NAME>.parse(value);
    throw new Error("expected parse to throw");
  } catch (e) {
    if (!(e instanceof ZodError)) throw e;
    const firstPath = e.issues[0]?.path ?? [];
    for (let i = 0; i < expectedPathPrefix.length; i += 1) {
      expect(firstPath[i]).toBe(expectedPathPrefix[i]);
    }
  }
}

describe("parse<TYPE_ALIAS>", () => {
  it("returns the parsed value for a well-formed payload", () => {
    // ... happy-path assertion
  });

  it("rejects when <required field> is missing", () => {
    // expectFirstIssuePathStartsWith(badInput, ["<field>"]);
  });
});

describe("<SCHEMA_NAME> (exported schema)", () => {
  it("is a Zod schema with a parse method", () => {
    expect(typeof <SCHEMA_NAME>.parse).toBe("function");
    expect(typeof <SCHEMA_NAME>.safeParse).toBe("function");
  });
});
```

## Bounds (hard)

- max **5** commands (read package.json, read target file if exists, emit schema template, emit test template; pad with a sanity check if absolutely necessary).
- no loops / polling.
- no writes — the skill emits templates to be reviewed and pasted by a human or by a subsequent agent step.
- no speculative file paths — the skill stops if `<TARGET_FILE>` is outside `packages/*-contracts/src/**` or `services/api/src/routes/**`.
- no hand-rolled type-guard helpers in the emitted template — they are forbidden by `eslint.config.mjs` `no-restricted-syntax` rule and by the rewritten `22-typescript-contracts-runtime-validation.mdc` plugin-pack rule.
- bounded output — no schema templates over ~60 lines of skeleton; refer the caller to `meResponse.ts` for complex cases.
