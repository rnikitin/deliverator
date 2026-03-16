import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getTasksForBoard, seedProjectDevelopmentState } from "@deliverator/db";
import { afterEach, describe, expect, it } from "vitest";

import { loadAppConfig } from "../src/config.js";
import { ProjectRegistryManager } from "../src/project-manager.js";

const createdDirs: string[] = [];

afterEach(() => {
  for (const directory of createdDirs.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("project manager", () => {
  it("does not seed new projects automatically", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-project-manager-"));
    const workspaceRoot = path.join(tempDir, "workspace");
    const otherProjectRoot = path.join(tempDir, "second-project");
    fs.mkdirSync(workspaceRoot, { recursive: true });
    fs.mkdirSync(otherProjectRoot, { recursive: true });
    createdDirs.push(tempDir);

    const config = loadAppConfig({
      NODE_ENV: "development",
      PORT: "0",
      HOME: tempDir
    });

    const manager = new ProjectRegistryManager(config, workspaceRoot);
    const sampleProject = manager.ensureDevelopmentProject();
    if (!sampleProject) {
      throw new Error("expected_sample_project");
    }

    const sampleContext = manager.getProjectContext(sampleProject.slug);
    const otherProject = manager.registerProject({
      rootPath: otherProjectRoot,
      name: "Second Project"
    }).project;
    const otherContext = manager.getProjectContext(otherProject.slug);

    if (!sampleContext || !otherContext) {
      throw new Error("expected_project_context");
    }

    expect(getTasksForBoard(sampleContext.dbContext)).toHaveLength(0);
    expect(getTasksForBoard(otherContext.dbContext)).toHaveLength(0);

    seedProjectDevelopmentState(otherContext.dbContext, otherProject);
    expect(getTasksForBoard(otherContext.dbContext)).toHaveLength(7);

    manager.close();
  });
});
