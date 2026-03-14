import type { InvocationBundle } from "@deliverator/contracts";

export const CODEX_CLI_ADAPTER_ID = "codex-cli";

export function buildCodexInvocation(repositoryPath: string, prompt: string): InvocationBundle {
  return {
    adapterId: CODEX_CLI_ADAPTER_ID,
    command: "codex",
    args: ["exec", prompt],
    cwd: repositoryPath,
    dryRun: true
  };
}
