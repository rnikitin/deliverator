import type { InvocationBundle } from "@deliverator/contracts";

export const CLAUDE_CLI_ADAPTER_ID = "claude-cli";

export function buildClaudeInvocation(repositoryPath: string, prompt: string): InvocationBundle {
  return {
    adapterId: CLAUDE_CLI_ADAPTER_ID,
    command: "claude",
    args: ["-p", prompt],
    cwd: repositoryPath,
    dryRun: true
  };
}
