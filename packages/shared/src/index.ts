import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface RuntimePaths {
  dataDir: string;
  worktreeDir: string;
  logsDir: string;
}

export interface WorktreeIdentity {
  worktreeId: string;
  projectName: string;
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

export function getDevRuntimePaths(rootDir: string): RuntimePaths {
  return {
    dataDir: path.join(rootDir, ".deliverator", "data"),
    worktreeDir: path.join(rootDir, ".deliverator", "worktrees"),
    logsDir: path.join(rootDir, ".deliverator", "logs")
  };
}

export function resolveRuntimePaths(rootDir: string, env: NodeJS.ProcessEnv): RuntimePaths {
  const defaults = env.NODE_ENV === "development" ? getDevRuntimePaths(rootDir) : getDefaultRuntimePaths();

  return {
    dataDir: expandHomeDir(env.DELIVERATOR_DATA_DIR || defaults.dataDir),
    worktreeDir: expandHomeDir(env.DELIVERATOR_WORKTREE_DIR || defaults.worktreeDir),
    logsDir: expandHomeDir(env.DELIVERATOR_LOGS_DIR || defaults.logsDir)
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

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
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

export function timestampNow(): string {
  return new Date().toISOString();
}
