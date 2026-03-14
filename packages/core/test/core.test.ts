import { describe, expect, it } from "vitest";

import { buildCompiledConfig, createBootstrapProject, getAttentionStateForStage, listInitialTasks } from "../src/index.js";

describe("core", () => {
  it("builds a compiled config", () => {
    const compiled = buildCompiledConfig({
      nodeEnv: "development",
      port: 3000,
      paths: {
        dataDir: "/tmp/data",
        worktreeDir: "/tmp/worktrees",
        logsDir: "/tmp/logs"
      },
      telemetry: {
        serviceName: "deliverator-server",
        otlpEndpoint: "http://localhost:4318",
        browserTracingEnabled: true,
        metricsPath: "/api/metrics"
      }
    });

    expect(compiled.stages).toHaveLength(6);
    expect(compiled.operatorShell.title).toBe("DELIVERATOR");
  });

  it("derives workflow data for bootstrap records", () => {
    const project = createBootstrapProject("/tmp/repo");
    const tasks = listInitialTasks(project.id);

    expect(tasks[0]?.projectId).toBe(project.id);
    expect(getAttentionStateForStage("review")).toBe("needs_human");
  });
});
