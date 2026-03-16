import { describe, expect, it } from "vitest";

import { resolveArtifactRoots, resolveRunArtifactDir } from "../src/index.js";

describe("artifacts", () => {
  it("resolves artifact roots", () => {
    const roots = resolveArtifactRoots({
      rootPath: "/tmp/repo",
      deliveratorDir: "/tmp/repo/.deliverator",
      sharedDir: "/tmp/repo/.deliverator/shared",
      localDir: "/tmp/repo/.deliverator/local",
      workflowFilePath: "/tmp/repo/.deliverator/shared/workflow.yaml",
      projectFilePath: "/tmp/repo/.deliverator/shared/project.yaml",
      databaseFilePath: "/tmp/repo/.deliverator/local/deliverator.db",
      artifactsDir: "/tmp/repo/.deliverator/local/artifacts",
      worktreesDir: "/tmp/repo/.deliverator/local/worktrees",
      logsDir: "/tmp/logs"
    });

    expect(roots.databaseFile).toBe("/tmp/repo/.deliverator/local/deliverator.db");
    expect(
      resolveRunArtifactDir(
        {
          rootPath: "/tmp/repo",
          deliveratorDir: "/tmp/repo/.deliverator",
          sharedDir: "/tmp/repo/.deliverator/shared",
          localDir: "/tmp/repo/.deliverator/local",
          workflowFilePath: "/tmp/repo/.deliverator/shared/workflow.yaml",
          projectFilePath: "/tmp/repo/.deliverator/shared/project.yaml",
          databaseFilePath: "/tmp/repo/.deliverator/local/deliverator.db",
          artifactsDir: "/tmp/repo/.deliverator/local/artifacts",
          worktreesDir: "/tmp/repo/.deliverator/local/worktrees",
          logsDir: "/tmp/logs"
        },
        "run-1"
      )
    ).toContain("run-1");
  });
});
