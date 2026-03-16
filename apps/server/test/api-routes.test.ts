import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildCompiledConfig } from "@deliverator/core";
import { seedProjectDevelopmentState } from "@deliverator/db";
import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { loadAppConfig } from "../src/config.js";
import { ProjectRegistryManager } from "../src/project-manager.js";
import { registerApiRoutes } from "../src/routes/api.js";

const createdDirs: string[] = [];

afterEach(() => {
  for (const directory of createdDirs.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("api routes", () => {
  it("serves registry, dashboard, feed, project board, and task endpoints", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-server-"));
    const projectDir = path.join(tempDir, "example-project");
    fs.mkdirSync(projectDir, { recursive: true });
    createdDirs.push(tempDir);

    const app = Fastify();
    const config = loadAppConfig({
      NODE_ENV: "test",
      PORT: "0",
      HOME: tempDir
    });
    const projectManager = new ProjectRegistryManager(config, projectDir);
    const { project } = projectManager.registerProject({
      rootPath: projectDir,
      name: "Example Project"
    });

    await registerApiRoutes(app, { config, projectManager });

    const healthResponse = await app.inject({ method: "GET", url: "/healthz" });
    expect(healthResponse.statusCode).toBe(200);

    const projectsResponse = await app.inject({ method: "GET", url: "/api/projects" });
    expect(projectsResponse.statusCode).toBe(200);
    expect(projectsResponse.json().projects).toHaveLength(1);
    expect(projectsResponse.json().lastSelectedProjectSlug).toBe(project.slug);

    const context = projectManager.getProjectContext(project.slug);
    if (!context) {
      throw new Error("expected_project_context");
    }
    seedProjectDevelopmentState(context.dbContext, project);

    const configResponse = await app.inject({
      method: "GET",
      url: `/api/projects/${project.slug}/config/compiled`
    });
    const actualCompiledConfig = configResponse.json();
    const expectedCompiledConfig = buildCompiledConfig(config, context.project, context.workflow);
    expect(actualCompiledConfig.generatedAt).toEqual(expect.any(String));
    expect({
      ...actualCompiledConfig,
      generatedAt: "<dynamic>"
    }).toEqual({
      ...expectedCompiledConfig,
      generatedAt: "<dynamic>"
    });

    const boardResponse = await app.inject({
      method: "GET",
      url: `/api/projects/${project.slug}/board`
    });
    expect(boardResponse.statusCode).toBe(200);
    const board = boardResponse.json();
    expect(board.project.slug).toBe(project.slug);
    expect(board.columns).toHaveLength(7);
    expect(board.columns[0].stageId).toBe("inbox");

    const taskResponse = await app.inject({
      method: "GET",
      url: `/api/projects/${project.slug}/tasks/task-foundation`
    });
    expect(taskResponse.statusCode).toBe(200);
    expect(taskResponse.json().task.id).toBe("task-foundation");

    const dashboardResponse = await app.inject({ method: "GET", url: "/api/dashboard" });
    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.json().counts.projects).toBe(1);
    expect(dashboardResponse.json().actionableItems.length).toBeGreaterThan(0);

    const feedResponse = await app.inject({ method: "GET", url: "/api/feed" });
    expect(feedResponse.statusCode).toBe(200);
    expect(feedResponse.json().events.length).toBeGreaterThan(0);
    expect(feedResponse.json().events[0].projectSlug).toBe(project.slug);

    projectManager.close();
    await app.close();
  });
});
