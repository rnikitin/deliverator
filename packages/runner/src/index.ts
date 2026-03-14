import type { ActionResult, InvocationBundle } from "@deliverator/contracts";
import { InvocationBundleSchema, assertSchema } from "@deliverator/contracts";

export interface ExecutionAdapter {
  id: string;
  description: string;
  buildInvocation(_input: Record<string, string>): InvocationBundle;
}

export interface AgentAdapter {
  id: string;
  cliCommand: string;
}

export interface ScmAdapter {
  id: string;
  cliCommand: string;
}

export interface RunnerDependencies {
  executionAdapters: ExecutionAdapter[];
  agentAdapters: AgentAdapter[];
  scmAdapters: ScmAdapter[];
}

export interface DryRunAction {
  adapterId: string;
  summary: string;
  bundle: InvocationBundle;
}

export function validateInvocationBundle(bundle: unknown): InvocationBundle {
  return assertSchema(InvocationBundleSchema, bundle);
}

export function createDryRunAction(bundle: InvocationBundle): DryRunAction {
  const validatedBundle = validateInvocationBundle(bundle);

  return {
    adapterId: validatedBundle.adapterId,
    summary: `${validatedBundle.command} ${validatedBundle.args.join(" ")}`.trim(),
    bundle: validatedBundle
  };
}

export function buildCompletedActionResult(bundle: InvocationBundle): ActionResult {
  return {
    adapterId: bundle.adapterId,
    success: true,
    exitCode: 0,
    stdout: bundle.dryRun ? "dry-run" : "",
    stderr: ""
  };
}
