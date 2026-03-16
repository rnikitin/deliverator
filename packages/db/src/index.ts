import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { FeedEvent, GlobalAppPaths, ProjectPaths, RegisteredProject, Task } from "@deliverator/contracts";
import { createRegisteredProject, listInitialTasks } from "@deliverator/core";
import { ensureDirectory, timestampNow } from "@deliverator/shared";

interface SqliteStatement {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): unknown;
}

interface SqliteClient {
  close(): void;
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

type SqliteDatabaseConstructor = new (path: string) => SqliteClient;

const SqliteDatabaseCtor = await loadSqliteDatabaseConstructor();

const projectMigrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const compiledMigrationsDir = projectMigrationsDir;
const sourceMigrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "migrations");
const resolvedProjectMigrationsDir = fs.existsSync(compiledMigrationsDir) ? compiledMigrationsDir : sourceMigrationsDir;

const REGISTRY_MIGRATIONS: ReadonlyArray<{ name: string; sql: string }> = [
  {
    name: "001_registry_schema.sql",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS registered_projects (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        root_path TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `
  }
];

export interface DatabaseContext {
  db: SqliteClient;
  filePath: string;
}

export interface RegistryDatabaseContext extends DatabaseContext {}

export interface ProjectDatabaseContext extends DatabaseContext {
  project: RegisteredProject;
  paths: ProjectPaths;
}

export interface DatabaseSeedResult {
  insertedProjects: number;
  insertedTasks: number;
  insertedEvents: number;
}

export interface BoardTaskRow {
  id: string;
  projectId: string;
  title: string;
  stage: string;
  attentionState: string;
  summary: string;
}

export interface TaskEventRow {
  id: string;
  taskId: string;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

export function openRegistryDatabase(globalPaths: GlobalAppPaths): RegistryDatabaseContext {
  ensureDirectory(globalPaths.dataDir);
  return openSqliteDatabase(globalPaths.registryDbPath);
}

export function openProjectDatabase(project: RegisteredProject, projectPaths: ProjectPaths): ProjectDatabaseContext {
  ensureDirectory(projectPaths.localDir);
  const context = openSqliteDatabase(projectPaths.databaseFilePath);
  return {
    ...context,
    project,
    paths: projectPaths
  };
}

function openSqliteDatabase(filePath: string): DatabaseContext {
  ensureDirectory(path.dirname(filePath));
  const db = new SqliteDatabaseCtor(filePath);

  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  return { db, filePath };
}

export function applyRegistryMigrations(context: RegistryDatabaseContext): number {
  return applyInlineMigrations(context, REGISTRY_MIGRATIONS);
}

export function applyProjectMigrations(context: ProjectDatabaseContext): number {
  ensureSchemaMigrationsTable(context);

  const applied = new Set<string>(
    context.db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row: unknown) => String((row as { name: string }).name))
  );

  const files = fs
    .readdirSync(resolvedProjectMigrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const markApplied = context.db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)");
  let appliedCount = 0;

  for (const fileName of files) {
    if (applied.has(fileName)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(resolvedProjectMigrationsDir, fileName), "utf8");
    context.db.exec(sql);
    markApplied.run(fileName, timestampNow());
    appliedCount += 1;
  }

  return appliedCount;
}

function applyInlineMigrations(
  context: DatabaseContext,
  migrations: ReadonlyArray<{ name: string; sql: string }>
): number {
  ensureSchemaMigrationsTable(context);

  const applied = new Set<string>(
    context.db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row: unknown) => String((row as { name: string }).name))
  );

  const markApplied = context.db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)");
  let appliedCount = 0;

  for (const migration of migrations) {
    if (applied.has(migration.name)) {
      continue;
    }

    context.db.exec(migration.sql);
    markApplied.run(migration.name, timestampNow());
    appliedCount += 1;
  }

  return appliedCount;
}

function ensureSchemaMigrationsTable(context: DatabaseContext): void {
  context.db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

export function registerProject(
  context: RegistryDatabaseContext,
  input: { rootPath: string; name?: string; slug?: string }
): RegisteredProject {
  const normalizedRootPath = path.resolve(input.rootPath);
  const existingByRoot = getRegisteredProjectByRootPath(context, normalizedRootPath);

  if (existingByRoot) {
    return existingByRoot;
  }

  const registeredProject = createRegisteredProject(normalizedRootPath, input.name);
  const project: RegisteredProject = {
    ...registeredProject,
    slug: input.slug || registeredProject.slug
  };

  context.db
    .prepare("INSERT INTO registered_projects (id, slug, name, root_path, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(project.id, project.slug, project.name, project.rootPath, project.createdAt);

  return project;
}

export function listRegisteredProjects(context: RegistryDatabaseContext): RegisteredProject[] {
  return context.db
    .prepare("SELECT id, slug, name, root_path AS rootPath, created_at AS createdAt FROM registered_projects ORDER BY name")
    .all() as RegisteredProject[];
}

export function getRegisteredProjectBySlug(
  context: RegistryDatabaseContext,
  projectSlug: string
): RegisteredProject | null {
  const row = context.db
    .prepare("SELECT id, slug, name, root_path AS rootPath, created_at AS createdAt FROM registered_projects WHERE slug = ?")
    .get(projectSlug) as RegisteredProject | undefined;

  return row || null;
}

export function unregisterProject(context: RegistryDatabaseContext, projectSlug: string): boolean {
  const existing = getRegisteredProjectBySlug(context, projectSlug);
  if (!existing) {
    return false;
  }

  context.db.prepare("DELETE FROM registered_projects WHERE slug = ?").run(projectSlug);

  const lastSelected = getLastSelectedProjectSlug(context);
  if (lastSelected !== projectSlug) {
    return true;
  }

  const nextProjectSlug = getFirstRegisteredProjectSlug(context);
  if (nextProjectSlug) {
    setLastSelectedProjectSlug(context, nextProjectSlug);
  } else {
    clearLastSelectedProjectSlug(context);
  }

  return true;
}

export function getLastSelectedProjectSlug(context: RegistryDatabaseContext): string | null {
  const row = context.db
    .prepare("SELECT value FROM app_state WHERE key = 'last_selected_project_slug'")
    .get() as { value: string } | undefined;
  return row?.value || null;
}

export function setLastSelectedProjectSlug(context: RegistryDatabaseContext, projectSlug: string): void {
  context.db
    .prepare(
      `
        INSERT INTO app_state (key, value, updated_at)
        VALUES ('last_selected_project_slug', ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `
    )
    .run(projectSlug, timestampNow());
}

function getRegisteredProjectByRootPath(
  context: RegistryDatabaseContext,
  rootPath: string
): RegisteredProject | undefined {
  return context.db
    .prepare(
      "SELECT id, slug, name, root_path AS rootPath, created_at AS createdAt FROM registered_projects WHERE root_path = ?"
    )
    .get(rootPath) as RegisteredProject | undefined;
}

function getFirstRegisteredProjectSlug(context: RegistryDatabaseContext): string | null {
  const row = context.db
    .prepare("SELECT slug FROM registered_projects ORDER BY name LIMIT 1")
    .get() as { slug: string } | undefined;

  return row?.slug ?? null;
}

function clearLastSelectedProjectSlug(context: RegistryDatabaseContext): void {
  context.db.prepare("DELETE FROM app_state WHERE key = 'last_selected_project_slug'").run();
}

export function seedProjectDevelopmentState(
  context: ProjectDatabaseContext,
  project: RegisteredProject = context.project
): DatabaseSeedResult {
  const existingProject = context.db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number };
  const existingTask = context.db.prepare("SELECT COUNT(*) AS count FROM tasks").get() as { count: number };

  let insertedProjects = 0;
  let insertedTasks = 0;
  let insertedEvents = 0;

  if (existingProject.count === 0) {
    context.db
      .prepare("INSERT INTO projects (id, slug, name, repository_path) VALUES (?, ?, ?, ?)")
      .run(project.id, project.slug, project.name, project.rootPath);
    insertedProjects = 1;
  }

  if (existingTask.count === 0) {
    const tasks = listInitialTasks(project.id);
    const insertTask = context.db.prepare(
      "INSERT INTO tasks (id, project_id, title, stage, attention_state, summary) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const insertEvent = context.db.prepare(
      "INSERT INTO task_events (id, task_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)"
    );

    for (const task of tasks) {
      insertTask.run(task.id, task.projectId, task.title, task.stage, task.attentionState, task.summary);
      insertEvent.run(
        `${task.id}-created`,
        task.id,
        "task.created",
        JSON.stringify({
          stage: task.stage,
          attentionState: task.attentionState,
          summary: task.summary
        }),
        timestampNow()
      );
      insertedTasks += 1;
      insertedEvents += 1;
    }
  }

  return { insertedProjects, insertedTasks, insertedEvents };
}

const TASK_COLUMNS = "id, project_id AS projectId, title, stage, attention_state AS attentionState, summary";

export function getTasksForBoard(context: ProjectDatabaseContext): BoardTaskRow[] {
  return cached(
    context,
    "tasksForBoard",
    `SELECT ${TASK_COLUMNS} FROM tasks ORDER BY rowid`
  ).all() as BoardTaskRow[];
}

export function getTaskById(context: ProjectDatabaseContext, taskId: string): Task | null {
  const row = cached(
    context,
    "taskById",
    `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = ?`
  ).get(taskId) as Task | undefined;

  return row || null;
}

export function listTaskEvents(context: ProjectDatabaseContext, limit = 20): TaskEventRow[] {
  const rows = cached(
    context,
    "listTaskEvents",
    `SELECT id, task_id AS taskId, event_type AS type, payload_json AS payloadJson, created_at AS createdAt
     FROM task_events
     ORDER BY datetime(created_at) DESC, rowid DESC
     LIMIT ?`
  ).all(limit) as Array<{
      id: string;
      taskId: string;
      type: string;
      payloadJson: string;
      createdAt: string;
    }>;

  return rows.map((row) => ({
    id: row.id,
    taskId: row.taskId,
    type: row.type,
    createdAt: row.createdAt,
    payload: safeParseJson(row.payloadJson)
  }));
}

export function buildFeedEvents(project: RegisteredProject, events: TaskEventRow[]): FeedEvent[] {
  return events.map((event) => ({
    id: event.id,
    projectSlug: project.slug,
    projectName: project.name,
    taskId: event.taskId,
    type: event.type,
    createdAt: event.createdAt,
    payload: event.payload
  }));
}

export function readinessSnapshot(context: DatabaseContext): { databasePath: string; migrationsApplied: number } {
  const row = cached(
    context,
    "migrationCount",
    "SELECT COUNT(*) AS count FROM schema_migrations"
  ).get() as { count: number };
  return {
    databasePath: context.filePath,
    migrationsApplied: row.count
  };
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function loadSqliteDatabaseConstructor(): Promise<SqliteDatabaseConstructor> {
  if ("Bun" in globalThis) {
    const module = await import("bun:sqlite");
    return module.Database as unknown as SqliteDatabaseConstructor;
  }

  const module = await import("better-sqlite3");
  return module.default as unknown as SqliteDatabaseConstructor;
}

/** Lazily cached prepared statements, keyed by DatabaseContext. */
const stmtCache = new WeakMap<SqliteClient, Record<string, ReturnType<SqliteClient["prepare"]>>>();

function cached(context: DatabaseContext, key: string, sql: string) {
  let map = stmtCache.get(context.db);
  if (!map) {
    map = {};
    stmtCache.set(context.db, map);
  }
  return (map[key] ??= context.db.prepare(sql));
}
