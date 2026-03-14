import { describe, expect, it } from "vitest";

import { resolveArtifactRoots, resolveRunArtifactDir } from "../src/index.js";

describe("artifacts", () => {
  it("resolves artifact roots", () => {
    const roots = resolveArtifactRoots({
      dataDir: "/tmp/data",
      worktreeDir: "/tmp/worktrees",
      logsDir: "/tmp/logs"
    });

    expect(roots.databaseFile).toBe("/tmp/data/deliverator.db");
    expect(resolveRunArtifactDir({ dataDir: "/tmp/data", worktreeDir: "/tmp/worktrees", logsDir: "/tmp/logs" }, "run-1")).toContain("run-1");
  });
});
