import type { InvocationBundle } from "@deliverator/contracts";

export const GITHUB_CLI_ADAPTER_ID = "github-cli";

export function buildGitHubPrViewInvocation(repositoryPath: string, pullRequestNumber: number): InvocationBundle {
  return {
    adapterId: GITHUB_CLI_ADAPTER_ID,
    command: "gh",
    args: ["pr", "view", String(pullRequestNumber), "--json", "title,body,state,url"],
    cwd: repositoryPath,
    dryRun: true
  };
}
