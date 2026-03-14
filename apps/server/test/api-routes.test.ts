import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildCompiledConfig } from "@deliverator/core";
import { applyMigrations, openDatabase, seedDevelopmentState } from "@deliverator/db";
import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { loadAppConfig } from "../src/config.js";
import { createMetrics } from "../src/metrics.js";
import { registerApiRoutes } from "../src/routes/api.js";

const createdDirs: string[] = [];

afterEach(() => {
  for (const directory of createdDirs.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("api routes", () => {
  it("serves health, config, task, and metrics endpoints", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-server-"));
    createdDirs.push(tempDir);

    const app = Fastify();
    const config = loadAppConfig(tempDir, {
      NODE_ENV: "test",
      PORT: "3000",
      DELIVERATOR_DATA_DIR: path.join(tempDir, "data"),
      DELIVERATOR_WORKTREE_DIR: path.join(tempDir, "worktrees"),
      DELIVERATOR_LOGS_DIR: path.join(tempDir, "logs")
    });
    const dbContext = openDatabase(config.paths);

    applyMigrations(dbContext);
    seedDevelopmentState(dbContext, tempDir);

    await registerApiRoutes(app, { config, dbContext, metrics: createMetrics() });

    const healthResponse = await app.inject({ method: "GET", url: "/healthz" });
    expect(healthResponse.statusCode).toBe(200);

    const configResponse = await app.inject({ method: "GET", url: "/api/config/compiled" });
    const actualCompiledConfig = configResponse.json();
    const expectedCompiledConfig = buildCompiledConfig(config);
    expect(actualCompiledConfig.generatedAt).toEqual(expect.any(String));
    expect(
      {
        ...actualCompiledConfig,
        generatedAt: "<dynamic>"
      }
    ).toEqual({
      ...expectedCompiledConfig,
      generatedAt: "<dynamic>"
    });

    const taskResponse = await app.inject({ method: "GET", url: "/api/tasks/task-foundation" });
    expect(taskResponse.statusCode).toBe(200);
    expect(taskResponse.json().task.id).toBe("task-foundation");

    const metricsResponse = await app.inject({ method: "GET", url: "/api/metrics" });
    expect(metricsResponse.statusCode).toBe(200);
    expect(metricsResponse.body).toContain("deliverator_http_requests_total");
  });
});
