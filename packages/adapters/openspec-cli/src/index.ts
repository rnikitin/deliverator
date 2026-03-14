import type { InvocationBundle } from "@deliverator/contracts";

export const OPENSPEC_CLI_ADAPTER_ID = "openspec-cli";

export function buildOpenSpecInvocation(repositoryPath: string, command: string): InvocationBundle {
  return {
    adapterId: OPENSPEC_CLI_ADAPTER_ID,
    command: "openspec",
    args: command.split(" ").filter(Boolean),
    cwd: repositoryPath,
    dryRun: true
  };
}
