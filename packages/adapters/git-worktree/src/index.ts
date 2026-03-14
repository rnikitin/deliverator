import type { InvocationBundle } from "@deliverator/contracts";

export const GIT_WORKTREE_ADAPTER_ID = "git-worktree";

export function buildGitWorktreeInvocation(repositoryPath: string, worktreePath: string, branchName: string): InvocationBundle {
  return {
    adapterId: GIT_WORKTREE_ADAPTER_ID,
    command: "git",
    args: ["worktree", "add", "-b", branchName, worktreePath, "HEAD"],
    cwd: repositoryPath,
    dryRun: true
  };
}
