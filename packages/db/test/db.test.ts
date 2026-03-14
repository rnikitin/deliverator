import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyMigrations, getProjects, getTaskById, openDatabase, readinessSnapshot, seedDevelopmentState } from "../src/index.js";

const createdDirs: string[] = [];

afterEach(() => {
  for (const directory of createdDirs.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("db", () => {
  it("applies migrations and seeds bootstrap data idempotently", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-db-"));
    createdDirs.push(tempDir);

    const context = openDatabase({
      dataDir: tempDir,
      worktreeDir: path.join(tempDir, "worktrees"),
      logsDir: path.join(tempDir, "logs")
    });

    expect(applyMigrations(context)).toBeGreaterThan(0);
    expect(applyMigrations(context)).toBe(0);

    expect(seedDevelopmentState(context, "/tmp/repo").insertedProjects).toBe(1);
    expect(seedDevelopmentState(context, "/tmp/repo").insertedProjects).toBe(0);

    expect(getProjects(context)).toHaveLength(1);
    expect(getTaskById(context, "task-foundation")?.title).toContain("technical foundation");
    expect(readinessSnapshot(context).migrationsApplied).toBeGreaterThan(0);
  });
});
