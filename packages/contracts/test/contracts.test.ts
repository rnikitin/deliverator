import { describe, expect, it } from "vitest";

import { AppConfigSchema, InvocationBundleSchema, assertSchema } from "../src/index.js";

describe("contracts", () => {
  it("accepts a valid app config", () => {
    const config = assertSchema(AppConfigSchema, {
      nodeEnv: "development",
      port: 3000,
      serviceName: "deliverator-server",
      globalPaths: {
        homeDir: "/tmp/home/.deliverator",
        dataDir: "/tmp/home/.deliverator/data",
        logsDir: "/tmp/home/.deliverator/logs",
        runDir: "/tmp/home/.deliverator/run",
        registryDbPath: "/tmp/home/.deliverator/data/registry.db",
        runtimeStatePath: "/tmp/home/.deliverator/run/current.json",
        appLogFilePath: "/tmp/home/.deliverator/logs/app.jsonl"
      }
    });

    expect(config.port).toBe(3000);
  });

  it("rejects an invalid invocation bundle", () => {
    expect(() =>
      assertSchema(InvocationBundleSchema, {
        adapterId: "local-process",
        command: "bun",
        args: [],
        cwd: 42
      })
    ).toThrowError(/Schema validation failed/);
  });
});
