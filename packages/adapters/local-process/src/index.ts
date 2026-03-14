import type { InvocationBundle } from "@deliverator/contracts";

export const LOCAL_PROCESS_ADAPTER_ID = "local-process";

export function buildLocalProcessInvocation(command: string, args: string[], cwd: string): InvocationBundle {
  return {
    adapterId: LOCAL_PROCESS_ADAPTER_ID,
    command,
    args,
    cwd,
    dryRun: true
  };
}
