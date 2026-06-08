import { describe, expect, it } from "vitest";

import { pathMatchesWorkspaceGlob } from "./validate.js";

describe("pathMatchesWorkspaceGlob", () => {
  it("matches single-segment workspace globs", () => {
    expect(pathMatchesWorkspaceGlob("apps/web", "apps/*")).toBe(true);
    expect(pathMatchesWorkspaceGlob("apps/native/brewery", "apps/*")).toBe(false);
  });

  it("matches multi-level native app workspace", () => {
    expect(pathMatchesWorkspaceGlob("apps/native/brewery", "apps/native/*")).toBe(true);
  });

  it("matches packages/platform and verticals globs", () => {
    expect(pathMatchesWorkspaceGlob("packages/platform/native-shell", "packages/platform/*")).toBe(
      true,
    );
    expect(
      pathMatchesWorkspaceGlob("packages/verticals/brewery/contracts", "packages/verticals/*/*"),
    ).toBe(true);
  });

  it("does not match docs-site vendor paths against docs-site root glob", () => {
    expect(pathMatchesWorkspaceGlob("docs-site", "docs-site")).toBe(true);
    expect(pathMatchesWorkspaceGlob("docs-site/vendor/brochure", "docs-site")).toBe(false);
  });
});
