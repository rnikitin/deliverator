import { Ajv, type ErrorObject } from "ajv";
import { Type, type Static, type TSchema } from "@sinclair/typebox";

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: false
});

const StageSchema = Type.String();

const AttentionStateSchema = Type.Union([
  Type.Literal("actively_working"),
  Type.Literal("awaiting_human_input"),
  Type.Literal("awaiting_human_approval"),
  Type.Literal("blocked"),
  Type.Literal("ready_for_feedback"),
  Type.Literal("ready_to_archive"),
  Type.Literal("paused_for_human")
]);

const RuntimePathsSchema = Type.Object({
  dataDir: Type.String(),
  worktreeDir: Type.String(),
  logsDir: Type.String()
});

const GlobalAppPathsSchema = Type.Object({
  homeDir: Type.String(),
  dataDir: Type.String(),
  logsDir: Type.String(),
  runDir: Type.String(),
  registryDbPath: Type.String(),
  runtimeStatePath: Type.String(),
  appLogFilePath: Type.String()
});

const ProjectPathsSchema = Type.Object({
  rootPath: Type.String(),
  deliveratorDir: Type.String(),
  sharedDir: Type.String(),
  localDir: Type.String(),
  workflowFilePath: Type.String(),
  projectFilePath: Type.String(),
  databaseFilePath: Type.String(),
  artifactsDir: Type.String(),
  worktreesDir: Type.String(),
  logsDir: Type.String()
});

const RuntimeStateSchema = Type.Object({
  pid: Type.Number(),
  port: Type.Number(),
  url: Type.String(),
  startedAt: Type.String()
});

const WorkflowStageSchema = Type.Object({
  id: StageSchema,
  label: Type.String(),
  attentionState: AttentionStateSchema
});

const AppConfigSchema = Type.Object({
  nodeEnv: Type.Union([
    Type.Literal("development"),
    Type.Literal("test"),
    Type.Literal("production")
  ]),
  port: Type.Number(),
  serviceName: Type.String(),
  globalPaths: GlobalAppPathsSchema
});

const RegisteredProjectSchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  rootPath: Type.String(),
  createdAt: Type.String()
});

const ProjectSchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  repositoryPath: Type.String()
});

const TaskSchema = Type.Object({
  id: Type.String(),
  projectId: Type.String(),
  title: Type.String(),
  stage: StageSchema,
  attentionState: AttentionStateSchema,
  summary: Type.String()
});

const TaskEventSchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  type: Type.String(),
  payload: Type.Record(Type.String(), Type.Unknown()),
  createdAt: Type.String()
});

const FeedEventSchema = Type.Object({
  id: Type.String(),
  projectSlug: Type.String(),
  projectName: Type.String(),
  taskId: Type.String(),
  type: Type.String(),
  createdAt: Type.String(),
  payload: Type.Record(Type.String(), Type.Unknown())
});

const ActionableTaskSchema = Type.Object({
  projectSlug: Type.String(),
  projectName: Type.String(),
  taskId: Type.String(),
  title: Type.String(),
  stage: StageSchema,
  attentionState: AttentionStateSchema,
  summary: Type.String()
});

const DashboardDataSchema = Type.Object({
  counts: Type.Record(Type.String(), Type.Number()),
  actionableItems: Type.Array(ActionableTaskSchema),
  recentEvents: Type.Array(FeedEventSchema)
});

const WorkspaceSchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  path: Type.String(),
  branchName: Type.String()
});

const RunStatusSchema = Type.Union([
  Type.Literal("pending"),
  Type.Literal("running"),
  Type.Literal("completed"),
  Type.Literal("failed")
]);

const RunSchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  stage: StageSchema,
  status: RunStatusSchema,
  createdAt: Type.String()
});

const ActionRunSchema = Type.Object({
  id: Type.String(),
  runId: Type.String(),
  adapterId: Type.String(),
  status: RunStatusSchema,
  correlationId: Type.String()
});

const ArtifactSchema = Type.Object({
  id: Type.String(),
  runId: Type.String(),
  kind: Type.String(),
  path: Type.String(),
  createdAt: Type.String()
});

const CommentSchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  author: Type.String(),
  body: Type.String(),
  createdAt: Type.String()
});

const AttachmentSchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  fileName: Type.String(),
  path: Type.String()
});

const ApprovalSchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  status: Type.Union([
    Type.Literal("pending"),
    Type.Literal("approved"),
    Type.Literal("rejected")
  ]),
  requestedBy: Type.String()
});

const InvocationBundleSchema = Type.Object({
  adapterId: Type.String(),
  command: Type.String(),
  args: Type.Array(Type.String()),
  cwd: Type.String(),
  env: Type.Optional(Type.Record(Type.String(), Type.String())),
  dryRun: Type.Boolean()
});

const ActionResultSchema = Type.Object({
  adapterId: Type.String(),
  success: Type.Boolean(),
  exitCode: Type.Number(),
  stdout: Type.String(),
  stderr: Type.String()
});

const StageResultSchema = Type.Object({
  runId: Type.String(),
  stage: StageSchema,
  status: Type.Union([
    Type.Literal("completed"),
    Type.Literal("failed"),
    Type.Literal("needs_attention")
  ]),
  summary: Type.String()
});

const SseEventSchema = Type.Object({
  event: Type.String(),
  data: Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean()]))
});

const CompiledStageSchema = Type.Object({
  id: Type.String(),
  label: Type.String(),
  mode: Type.Union([Type.Literal("manual"), Type.Literal("automatic"), Type.Literal("hybrid")])
});

const CompiledWorkflowSchema = Type.Object({
  stages: Type.Array(CompiledStageSchema),
  allowedMoves: Type.Record(Type.String(), Type.Array(Type.String()))
});

const CompiledConfigSchema = Type.Object({
  generatedAt: Type.String(),
  app: AppConfigSchema,
  project: RegisteredProjectSchema,
  workflow: CompiledWorkflowSchema,
  operatorShell: Type.Object({
    title: Type.String(),
    subtitle: Type.String()
  })
});

export type Stage = Static<typeof StageSchema>;
export type AttentionState = Static<typeof AttentionStateSchema>;
export type RuntimePaths = Static<typeof RuntimePathsSchema>;
export type GlobalAppPaths = Static<typeof GlobalAppPathsSchema>;
export type ProjectPaths = Static<typeof ProjectPathsSchema>;
export type RuntimeState = Static<typeof RuntimeStateSchema>;
export type WorkflowStage = Static<typeof WorkflowStageSchema>;
export type CompiledStage = Static<typeof CompiledStageSchema>;
export type CompiledWorkflow = Static<typeof CompiledWorkflowSchema>;
export type AppConfig = Static<typeof AppConfigSchema>;
export type RegisteredProject = Static<typeof RegisteredProjectSchema>;
export type Project = Static<typeof ProjectSchema>;
export type Task = Static<typeof TaskSchema>;
export type TaskEvent = Static<typeof TaskEventSchema>;
export type FeedEvent = Static<typeof FeedEventSchema>;
export type ActionableTask = Static<typeof ActionableTaskSchema>;
export type DashboardData = Static<typeof DashboardDataSchema>;
export type Workspace = Static<typeof WorkspaceSchema>;
export type RunStatus = Static<typeof RunStatusSchema>;
export type Run = Static<typeof RunSchema>;
export type ActionRun = Static<typeof ActionRunSchema>;
export type Artifact = Static<typeof ArtifactSchema>;
export type Comment = Static<typeof CommentSchema>;
export type Attachment = Static<typeof AttachmentSchema>;
export type Approval = Static<typeof ApprovalSchema>;
export type InvocationBundle = Static<typeof InvocationBundleSchema>;
export type ActionResult = Static<typeof ActionResultSchema>;
export type StageResult = Static<typeof StageResultSchema>;
export type SseEvent = Static<typeof SseEventSchema>;
export type CompiledConfig = Static<typeof CompiledConfigSchema>;

export {
  ActionResultSchema,
  ActionRunSchema,
  ActionableTaskSchema,
  AppConfigSchema,
  ApprovalSchema,
  ArtifactSchema,
  AttachmentSchema,
  AttentionStateSchema,
  CommentSchema,
  CompiledConfigSchema,
  CompiledStageSchema,
  CompiledWorkflowSchema,
  DashboardDataSchema,
  FeedEventSchema,
  GlobalAppPathsSchema,
  InvocationBundleSchema,
  ProjectPathsSchema,
  ProjectSchema,
  RegisteredProjectSchema,
  RuntimePathsSchema,
  RuntimeStateSchema,
  RunSchema,
  RunStatusSchema,
  SseEventSchema,
  StageResultSchema,
  StageSchema,
  TaskEventSchema,
  TaskSchema,
  WorkflowStageSchema,
  WorkspaceSchema
};

export const ATTENTION_STATES = [
  { id: "actively_working" as const, label: "Working" },
  { id: "awaiting_human_input" as const, label: "Needs Input" },
  { id: "awaiting_human_approval" as const, label: "Needs Approval" },
  { id: "blocked" as const, label: "Blocked" },
  { id: "ready_for_feedback" as const, label: "Ready for Review" },
  { id: "ready_to_archive" as const, label: "Archive" },
  { id: "paused_for_human" as const, label: "Paused" }
] satisfies ReadonlyArray<{ id: AttentionState; label: string }>;

const validatorCache = new WeakMap<TSchema, ReturnType<typeof ajv.compile>>();

function getValidator<T extends TSchema>(schema: T): ReturnType<typeof ajv.compile> {
  let validator = validatorCache.get(schema);
  if (!validator) {
    validator = ajv.compile(schema);
    validatorCache.set(schema, validator);
  }
  return validator;
}

export function validateSchema<T extends TSchema>(schema: T, value: unknown): value is Static<T> {
  const validator = getValidator(schema);
  return validator(value) as boolean;
}

export function assertSchema<T extends TSchema>(schema: T, value: unknown): Static<T> {
  const validator = getValidator(schema);
  if (validator(value)) {
    return value as Static<T>;
  }

  const message = validator.errors
    ?.map((error: ErrorObject) => `${error.instancePath || "/"} ${error.message || "invalid"}`)
    .join("; ");
  throw new Error(`Schema validation failed: ${message || "unknown error"}`);
}
