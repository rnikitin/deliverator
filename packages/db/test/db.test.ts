import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  applyProjectMigrations,
  applyRegistryMigrations,
  getLastSelectedProjectSlug,
  getTaskById,
  getTasksForBoard,
  listRegisteredProjects,
  openProjectDatabase,
  openRegistryDatabase,
  readinessSnapshot,
  registerProject,
  seedProjectDevelopmentState,
  setLastSelectedProjectSlug
} from "../src/index.js";
import { resolveGlobalAppPaths, resolveProjectPaths } from "@deliverator/shared";

const createdDirs: string[] = [];

afterEach(() => {
  for (const directory of createdDirs.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("db", () => {
  it("applies registry and project migrations and seeds bootstrap data", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-db-"));
    const projectDir = path.join(tempDir, "example-project");
    fs.mkdirSync(projectDir, { recursive: true });
    createdDirs.push(tempDir);

    const registryContext = openRegistryDatabase(
      resolveGlobalAppPaths({ HOME: tempDir } as NodeJS.ProcessEnv)
    );
    expect(applyRegistryMigrations(registryContext)).toBeGreaterThan(0);
    expect(applyRegistryMigrations(registryContext)).toBe(0);

    const project = registerProject(registryContext, { rootPath: projectDir, name: "Example Project" });
    setLastSelectedProjectSlug(registryContext, project.slug);

    const projectContext = openProjectDatabase(project, resolveProjectPaths(projectDir));
    expect(applyProjectMigrations(projectContext)).toBeGreaterThan(0);
    expect(applyProjectMigrations(projectContext)).toBe(0);

    expect(seedProjectDevelopmentState(projectContext, project).insertedProjects).toBe(1);
    expect(seedProjectDevelopmentState(projectContext, project).insertedProjects).toBe(0);

    expect(listRegisteredProjects(registryContext)).toHaveLength(1);
    expect(getLastSelectedProjectSlug(registryContext)).toBe(project.slug);
    expect(getTasksForBoard(projectContext).length).toBeGreaterThan(1);
    expect(getTaskById(projectContext, "task-foundation")?.title).toContain("Register the first project");
    expect(readinessSnapshot(projectContext).migrationsApplied).toBeGreaterThan(0);

    projectContext.db.close();
    registryContext.db.close();
  });
});
