import path from "node:path";

import type { ProjectPaths } from "@deliverator/contracts";

export interface ArtifactRoots {
  artifactsDir: string;
  canonicalDir: string;
  databaseFile: string;
  logsDir: string;
  snapshotsDir: string;
  worktreesDir: string;
}

export function resolveArtifactRoots(paths: ProjectPaths): ArtifactRoots {
  const artifactsDir = paths.artifactsDir;

  return {
    artifactsDir,
    canonicalDir: path.join(artifactsDir, "canonical"),
    databaseFile: paths.databaseFilePath,
    logsDir: paths.logsDir,
    snapshotsDir: path.join(artifactsDir, "snapshots"),
    worktreesDir: paths.worktreesDir
  };
}

export function resolveRunArtifactDir(paths: ProjectPaths, runId: string): string {
  return path.join(resolveArtifactRoots(paths).canonicalDir, "runs", runId);
}
