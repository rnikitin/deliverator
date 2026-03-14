import { describe, expect, it } from "vitest";

import { deriveWorktreeIdentity, getDevRuntimePaths, sanitizeSlug } from "../src/index.js";

describe("shared", () => {
  it("derives stable worktree identity", () => {
    const identity = deriveWorktreeIdentity("/tmp/My Repo");

    expect(identity.worktreeId).toMatch(/^my-repo-/);
    expect(identity.projectName).toMatch(/^deliverator-/);
  });

  it("resolves dev runtime paths", () => {
    const paths = getDevRuntimePaths("/tmp/repo");

    expect(paths.dataDir).toBe("/tmp/repo/.deliverator/data");
    expect(sanitizeSlug("Deliverator Repo")).toBe("deliverator-repo");
  });
});
