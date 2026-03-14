import path from "node:path";

import type { PathsConfig } from "@deliverator/contracts";

export interface ArtifactRoots {
  artifactsDir: string;
  canonicalDir: string;
  databaseFile: string;
  logsDir: string;
  snapshotsDir: string;
  worktreesDir: string;
}

export function resolveArtifactRoots(paths: PathsConfig): ArtifactRoots {
  const artifactsDir = path.join(paths.dataDir, "artifacts");

  return {
    artifactsDir,
    canonicalDir: path.join(artifactsDir, "canonical"),
    databaseFile: path.join(paths.dataDir, "deliverator.db"),
    logsDir: paths.logsDir,
    snapshotsDir: path.join(artifactsDir, "snapshots"),
    worktreesDir: paths.worktreeDir
  };
}

export function resolveRunArtifactDir(paths: PathsConfig, runId: string): string {
  return path.join(resolveArtifactRoots(paths).canonicalDir, "runs", runId);
}
