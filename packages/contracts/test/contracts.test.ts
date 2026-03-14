import { describe, expect, it } from "vitest";

import { AppConfigSchema, InvocationBundleSchema, assertSchema } from "../src/index.js";

describe("contracts", () => {
  it("accepts a valid app config", () => {
    const config = assertSchema(AppConfigSchema, {
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

    expect(config.port).toBe(3000);
  });

  it("rejects an invalid invocation bundle", () => {
    expect(() =>
      assertSchema(InvocationBundleSchema, {
        adapterId: "local-process",
        command: "pnpm",
        args: [],
        cwd: 42
      })
    ).toThrowError(/Schema validation failed/);
  });
});
