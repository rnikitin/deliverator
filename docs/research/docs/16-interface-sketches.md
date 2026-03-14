# 16. Interface Sketches

## Core types

```ts
export type StageId =
  | "inbox"
  | "discovery"
  | "research"
  | "build_test"
  | "feedback"
  | "deploy"
  | "done";

export type AttentionState =
  | "actively_working"
  | "awaiting_human_input"
  | "awaiting_human_approval"
  | "blocked"
  | "ready_for_feedback"
  | "ready_to_archive"
  | "paused_for_human";
```

## Workflow compiler

```ts
export interface CompiledWorkflow {
  workflowId: string;
  columns: CompiledColumn[];
  stages: Record<StageId, CompiledStage>;
  filters: string[];
}

export interface CompiledStage {
  id: StageId;
  title: string;
  mode: "manual" | "hybrid" | "automated" | "terminal";
  entryActions: CompiledActionRef[];
  actions: CompiledActionRef[];
  loop?: CompiledLoop;
  gates: CompiledGate[];
  exitActions: CompiledActionRef[];
  allowedManualMovesTo: StageId[];
}
```

## Adapter interfaces

```ts
export interface RuntimeAdapter {
  kind: string;
  execute(bundle: InvocationBundle): Promise<ProcessHandle>;
  cancel(handle: ProcessHandle): Promise<void>;
}

export interface AgentAdapter {
  kind: string;
  compile(input: AgentActionInput): Promise<InvocationBundle>;
  parseResult(run: ProcessCompletedEvent): Promise<ActionResult>;
}

export interface WorkspaceAdapter {
  ensureWorkspace(input: EnsureWorkspaceInput): Promise<WorkspaceState>;
  cleanupWorkspace(input: CleanupWorkspaceInput): Promise<void>;
}

export interface ScmAdapter {
  ensureBranch(input: EnsureBranchInput): Promise<ScmBranchState>;
  ensurePullRequest(input: EnsurePrInput): Promise<PullRequestState>;
  mergePullRequest(input: MergePrInput): Promise<MergeResult>;
}
```

## Runner interfaces

```ts
export interface InvocationBundle {
  taskId: string;
  runId: string;
  actionRunId: string;
  stage: StageId;
  actionKind: string;
  adapter: string;
  runtime: string;
  cwd: string;
  argv: string[];
  env: Record<string, string>;
  timeoutMs: number;
  expectedOutputs: DeclaredOutput[];
}

export interface ActionResult {
  status:
    | "success"
    | "failed_retryable"
    | "failed_terminal"
    | "blocked"
    | "cancelled";
  decision:
    | "continue"
    | "repeat"
    | "human_handoff"
    | "blocked"
    | "advance"
    | "stop";
  summary: string;
  artifacts: string[];
  structuredOutput?: unknown;
  validatorResults?: ValidatorResult[];
}
```

## Artifact collector

```ts
export interface ArtifactCollector {
  collect(input: CollectArtifactsInput): Promise<CollectedArtifact[]>;
  markCanonical(input: MarkCanonicalInput): Promise<void>;
}
```

## State machine service

```ts
export interface TaskStateService {
  moveTask(input: MoveTaskInput): Promise<TaskState>;
  applyReaction(input: ReactionEvent): Promise<void>;
  startRun(input: StartRunInput): Promise<RunState>;
  finalizeRun(input: FinalizeRunInput): Promise<RunState>;
}
```
