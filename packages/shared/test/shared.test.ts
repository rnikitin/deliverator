import { describe, expect, it } from "vitest";

import { deriveWorktreeIdentity, resolveGlobalAppPaths, resolveProjectPaths, sanitizeSlug } from "../src/index.js";

describe("shared", () => {
  it("derives stable worktree identity", () => {
    const identity = deriveWorktreeIdentity("/tmp/My Repo");

    expect(identity.worktreeId).toMatch(/^my-repo-/);
    expect(identity.projectName).toMatch(/^deliverator-/);
  });

  it("resolves global and project runtime paths", () => {
    const globalPaths = resolveGlobalAppPaths({ HOME: "/tmp/home" } as NodeJS.ProcessEnv);
    const projectPaths = resolveProjectPaths("/tmp/repo");

    expect(globalPaths.registryDbPath).toBe("/tmp/home/.deliverator/data/registry.db");
    expect(projectPaths.sharedDir).toBe("/tmp/repo/.deliverator/shared");
    expect(projectPaths.localDir).toBe("/tmp/repo/.deliverator/local");
    expect(sanitizeSlug("Deliverator Repo")).toBe("deliverator-repo");
  });
});
