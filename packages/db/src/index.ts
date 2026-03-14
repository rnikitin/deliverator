import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { PathsConfig, Project, Task } from "@deliverator/contracts";
import { createBootstrapProject, listInitialTasks } from "@deliverator/core";
import { ensureDirectory, timestampNow } from "@deliverator/shared";
import Database from "better-sqlite3";

type SqliteDatabase = InstanceType<typeof Database>;

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

export interface DatabaseContext {
  db: SqliteDatabase;
  filePath: string;
}

export interface DatabaseSeedResult {
  insertedProjects: number;
  insertedTasks: number;
}

export function openDatabase(paths: PathsConfig): DatabaseContext {
  ensureDirectory(paths.dataDir);
  const filePath = path.join(paths.dataDir, "deliverator.db");
  const db = new Database(filePath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return { db, filePath };
}

export function applyMigrations(context: DatabaseContext): number {
  context.db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set<string>(
    context.db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row: unknown) => String((row as { name: string }).name))
  );

  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const markApplied = context.db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)");
  let appliedCount = 0;

  for (const fileName of files) {
    if (applied.has(fileName)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, fileName), "utf8");
    context.db.exec(sql);
    markApplied.run(fileName, timestampNow());
    appliedCount += 1;
  }

  return appliedCount;
}

export function seedDevelopmentState(context: DatabaseContext, rootDir: string): DatabaseSeedResult {
  const existingProject = context.db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number };
  const existingTask = context.db.prepare("SELECT COUNT(*) AS count FROM tasks").get() as { count: number };

  let insertedProjects = 0;
  let insertedTasks = 0;

  if (existingProject.count === 0) {
    const project = createBootstrapProject(rootDir);
    context.db
      .prepare("INSERT INTO projects (id, slug, name, repository_path) VALUES (?, ?, ?, ?)")
      .run(project.id, project.slug, project.name, project.repositoryPath);
    insertedProjects = 1;
  }

  if (existingTask.count === 0) {
    const tasks = listInitialTasks("project-deliverator");
    const statement = context.db.prepare(
      "INSERT INTO tasks (id, project_id, title, stage, attention_state, summary) VALUES (?, ?, ?, ?, ?, ?)"
    );

    for (const task of tasks) {
      statement.run(task.id, task.projectId, task.title, task.stage, task.attentionState, task.summary);
      insertedTasks += 1;
    }
  }

  return { insertedProjects, insertedTasks };
}

export function getProjects(context: DatabaseContext): Project[] {
  return context.db
    .prepare("SELECT id, slug, name, repository_path AS repositoryPath FROM projects ORDER BY name")
    .all() as Project[];
}

export function getTaskById(context: DatabaseContext, taskId: string): Task | null {
  const row = context.db
    .prepare(
      "SELECT id, project_id AS projectId, title, stage, attention_state AS attentionState, summary FROM tasks WHERE id = ?"
    )
    .get(taskId) as Task | undefined;

  return row || null;
}

export function readinessSnapshot(context: DatabaseContext): { databasePath: string; migrationsApplied: number } {
  const row = context.db.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get() as { count: number };
  return {
    databasePath: context.filePath,
    migrationsApplied: row.count
  };
}
