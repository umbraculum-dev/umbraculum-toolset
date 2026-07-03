# Bugbot review rules — TypeScript / Node monorepo

Feature work merges via PRs to **`master`**. Suggested flow: optional local `/review-bugbot` before push; on PR comment `bugbot run` for cloud review. Runtime verification remains GHA + `npm run verify:from-diff` / `verify:pre-push`.

**Policy:** Report findings only. Do not suggest Autofix or auto-commits.

---

## Contracts and runtime validation

- Flag boundary-crossing code that trusts external JSON with `as SomeDto` or `as any` instead of Zod parse (`unknown` → schema).
- Flag Fastify routes emitting JSON without `schema.response` (except documented 204/redirect/stream exceptions per rule `22-typescript-contracts-runtime-validation.mdc`).
- Flag parallel `interface Foo` + Zod schema for the same wire shape when `z.infer<typeof FooSchema>` should be canonical.
- Flag hand-rolled type guards where a Zod schema is the project standard.
- Flag contract package changes without corresponding test updates using `safeParse` + `error.issues[].path`.

## Verification tiers

- Flag feature PRs that change `apps/**`, `services/**`, or `packages/**` without evidence the author ran scoped verification (`verify:from-diff` or named slice per `76-verification-tiers-gate.mdc`).
- Flag manifest/ci-parity pin changes without calling out T2-release (`verify:pre-push:release`) when applicable.

## Lockfile and workspace hygiene

- Flag new or modified `package-lock.json` at nested paths (e.g. `services/api/package-lock.json`) — root lockfile only per `80-monorepo-lockfile-agent-gate.mdc`.
- Flag agent/human `npm install` at repo root without using project lock scripts when lockfile policy applies.

## README and module docs

- Flag new packages or modules missing required README structure (overview, config, API surface) when the repo documents module README gates.
- Flag RFC-backed features without companion doc updates when the change touches accepted RFC consumers.

## Cross-platform boundaries

- Flag shared logic duplicated into `apps/web` and `apps/native` when it belongs in `packages/**`.
- Flag `@umbraculum/ui` importing domain packages against layering rules in `docs/CROSS-PLATFORM-BOUNDARIES.md`.

## TypeScript / ESLint

- Flag new `any` in production paths without justification.
- Flag eslint-disable comments added without a narrow scope and reason.

## Tests

- If the PR modifies non-trivial route, contract, or shared-package behavior, flag when there are no corresponding unit/integration test changes in the expected paths.

## Out of scope for this review

Do not treat absence of runtime proof as a blocking bug:

- Full `npx @umbraculum/ci-parity` execution
- Docker volume warm-up timing
- Playwright E2E browser runs
- Native Expo device builds

Flag only issues visible from the diff and static analysis.
