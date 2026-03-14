import { describe, expect, it } from "vitest";

import { buildCompletedActionResult, createDryRunAction } from "../src/index.js";

describe("runner", () => {
  it("creates a dry-run action summary", () => {
    const dryRun = createDryRunAction({
      adapterId: "local-process",
      command: "pnpm",
      args: ["test"],
      cwd: "/tmp/repo",
      dryRun: true
    });

    expect(dryRun.summary).toContain("pnpm test");
    expect(buildCompletedActionResult(dryRun.bundle).stdout).toBe("dry-run");
  });
});
