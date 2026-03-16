import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface RuntimePaths {
  dataDir: string;
  worktreeDir: string;
  logsDir: string;
}

export interface GlobalAppPaths {
  homeDir: string;
  dataDir: string;
  logsDir: string;
  runDir: string;
  registryDbPath: string;
  runtimeStatePath: string;
  appLogFilePath: string;
}

export interface ProjectPaths {
  rootPath: string;
  deliveratorDir: string;
  sharedDir: string;
  localDir: string;
  workflowFilePath: string;
  projectFilePath: string;
  databaseFilePath: string;
  artifactsDir: string;
  worktreesDir: string;
  logsDir: string;
}

export interface WorktreeIdentity {
  worktreeId: string;
  projectName: string;
}

export interface RuntimeState {
  pid: number;
  port: number;
  url: string;
  startedAt: string;
}

export interface GitignoreUpdateResult {
  updated: boolean;
  skipped: boolean;
  reason?: string;
}

const DEFAULT_ROOT = path.join(os.homedir(), ".deliverator");

export function expandHomeDir(value: string): string {
  if (value === "~") {
    return os.homedir();
  }

  if (value.startsWith("~/")) {
    return path.join(os.homedir(), value.slice(2));
  }

  return value;
}

export function getDefaultRuntimePaths(): RuntimePaths {
  return {
    dataDir: path.join(DEFAULT_ROOT, "data"),
    worktreeDir: path.join(DEFAULT_ROOT, "worktrees"),
    logsDir: path.join(DEFAULT_ROOT, "logs")
  };
}

export function resolveGlobalAppPaths(env: NodeJS.ProcessEnv = process.env): GlobalAppPaths {
  const configuredHome = env.DELIVERATOR_HOME || (env.HOME ? path.join(env.HOME, ".deliverator") : DEFAULT_ROOT);
  const homeDir = expandHomeDir(configuredHome);
  const dataDir = path.join(homeDir, "data");
  const logsDir = path.join(homeDir, "logs");
  const runDir = path.join(homeDir, "run");

  return {
    homeDir,
    dataDir,
    logsDir,
    runDir,
    registryDbPath: path.join(dataDir, "registry.db"),
    runtimeStatePath: path.join(runDir, "current.json"),
    appLogFilePath: path.join(logsDir, "app.jsonl")
  };
}

export function ensureDirectory(directoryPath: string): string {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
}

export function ensureRuntimeDirectories(paths: RuntimePaths): RuntimePaths {
  ensureDirectory(paths.dataDir);
  ensureDirectory(paths.worktreeDir);
  ensureDirectory(paths.logsDir);
  return paths;
}

export function ensureGlobalAppDirectories(paths: GlobalAppPaths): GlobalAppPaths {
  ensureDirectory(paths.homeDir);
  ensureDirectory(paths.dataDir);
  ensureDirectory(paths.logsDir);
  ensureDirectory(paths.runDir);
  return paths;
}

export function resolveProjectPaths(rootPath: string): ProjectPaths {
  const resolvedRoot = path.resolve(rootPath);
  const deliveratorDir = path.join(resolvedRoot, ".deliverator");
  const sharedDir = path.join(deliveratorDir, "shared");
  const localDir = path.join(deliveratorDir, "local");

  return {
    rootPath: resolvedRoot,
    deliveratorDir,
    sharedDir,
    localDir,
    workflowFilePath: path.join(sharedDir, "workflow.yaml"),
    projectFilePath: path.join(sharedDir, "project.yaml"),
    databaseFilePath: path.join(localDir, "deliverator.db"),
    artifactsDir: path.join(localDir, "artifacts"),
    worktreesDir: path.join(localDir, "worktrees"),
    logsDir: path.join(localDir, "logs")
  };
}

export function ensureProjectDirectories(paths: ProjectPaths): ProjectPaths {
  ensureDirectory(paths.sharedDir);
  ensureDirectory(paths.localDir);
  ensureDirectory(paths.artifactsDir);
  ensureDirectory(paths.worktreesDir);
  ensureDirectory(paths.logsDir);
  return paths;
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function deriveProjectSlug(rootPath: string, explicitName?: string): string {
  const seed = explicitName?.trim() || path.basename(path.resolve(rootPath));
  return sanitizeSlug(seed) || "project";
}

export function deriveProjectName(rootPath: string, explicitName?: string): string {
  return explicitName?.trim() || path.basename(path.resolve(rootPath)) || "Project";
}

export function deriveStableId(prefix: string, input: string): string {
  const hash = crypto.createHash("sha1").update(path.resolve(input)).digest("hex").slice(0, 12);
  return `${prefix}-${hash}`;
}

export function deriveWorktreeIdentity(rootDir: string): WorktreeIdentity {
  const resolvedRoot = path.resolve(rootDir);
  const slug = sanitizeSlug(path.basename(resolvedRoot)) || "deliverator";
  const hash = crypto.createHash("sha1").update(resolvedRoot).digest("hex").slice(0, 8);

  return {
    worktreeId: `${slug}-${hash}`,
    projectName: `deliverator-${hash.slice(0, 6)}`
  };
}

export function isGitProject(rootPath: string): boolean {
  const gitPath = path.join(rootPath, ".git");
  return fs.existsSync(gitPath);
}

export function ensureProjectLocalIgnored(rootPath: string): GitignoreUpdateResult {
  if (!isGitProject(rootPath)) {
    return {
      updated: false,
      skipped: true,
      reason: "not_a_git_project"
    };
  }

  const gitignorePath = path.join(rootPath, ".gitignore");
  const rule = ".deliverator/local/";
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";

  if (existing.split(/\r?\n/).some((line) => line.trim() === rule)) {
    return { updated: false, skipped: false };
  }

  const next = existing.trimEnd();
  const content = next ? `${next}\n${rule}\n` : `${rule}\n`;
  fs.writeFileSync(gitignorePath, content, "utf8");

  return { updated: true, skipped: false };
}

export function writeRuntimeState(paths: GlobalAppPaths, state: RuntimeState): void {
  ensureDirectory(paths.runDir);
  fs.writeFileSync(paths.runtimeStatePath, JSON.stringify(state, null, 2), "utf8");
}

export function readRuntimeState(paths: GlobalAppPaths): RuntimeState | null {
  if (!fs.existsSync(paths.runtimeStatePath)) {
    return null;
  }

  const raw = fs.readFileSync(paths.runtimeStatePath, "utf8");
  return JSON.parse(raw) as RuntimeState;
}

export function timestampNow(): string {
  return new Date().toISOString();
}
