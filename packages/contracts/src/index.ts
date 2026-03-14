import { Ajv, type ErrorObject } from "ajv";
import { Type, type Static, type TSchema } from "@sinclair/typebox";

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: false
});

const StageSchema = Type.Union([
  Type.Literal("triage"),
  Type.Literal("ready"),
  Type.Literal("in_progress"),
  Type.Literal("review"),
  Type.Literal("blocked"),
  Type.Literal("done")
]);

const AttentionStateSchema = Type.Union([
  Type.Literal("normal"),
  Type.Literal("needs_human"),
  Type.Literal("waiting_on_dependency"),
  Type.Literal("failed")
]);

const PathsConfigSchema = Type.Object({
  dataDir: Type.String(),
  worktreeDir: Type.String(),
  logsDir: Type.String()
});

const TelemetryConfigSchema = Type.Object({
  serviceName: Type.String(),
  otlpEndpoint: Type.String(),
  browserTracingEnabled: Type.Boolean(),
  metricsPath: Type.String()
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
  paths: PathsConfigSchema,
  telemetry: TelemetryConfigSchema
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

const WorkspaceSchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  path: Type.String(),
  branchName: Type.String()
});

const RunSchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  stage: StageSchema,
  status: Type.Union([
    Type.Literal("pending"),
    Type.Literal("running"),
    Type.Literal("completed"),
    Type.Literal("failed")
  ]),
  createdAt: Type.String()
});

const ActionRunSchema = Type.Object({
  id: Type.String(),
  runId: Type.String(),
  adapterId: Type.String(),
  status: Type.Union([
    Type.Literal("pending"),
    Type.Literal("running"),
    Type.Literal("completed"),
    Type.Literal("failed")
  ]),
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

const CompiledConfigSchema = Type.Object({
  generatedAt: Type.String(),
  app: AppConfigSchema,
  stages: Type.Array(WorkflowStageSchema),
  operatorShell: Type.Object({
    title: Type.String(),
    subtitle: Type.String()
  })
});

export type Stage = Static<typeof StageSchema>;
export type AttentionState = Static<typeof AttentionStateSchema>;
export type PathsConfig = Static<typeof PathsConfigSchema>;
export type TelemetryConfig = Static<typeof TelemetryConfigSchema>;
export type WorkflowStage = Static<typeof WorkflowStageSchema>;
export type AppConfig = Static<typeof AppConfigSchema>;
export type Project = Static<typeof ProjectSchema>;
export type Task = Static<typeof TaskSchema>;
export type TaskEvent = Static<typeof TaskEventSchema>;
export type Workspace = Static<typeof WorkspaceSchema>;
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
  AppConfigSchema,
  ApprovalSchema,
  ArtifactSchema,
  AttachmentSchema,
  AttentionStateSchema,
  CommentSchema,
  CompiledConfigSchema,
  InvocationBundleSchema,
  PathsConfigSchema,
  ProjectSchema,
  RunSchema,
  SseEventSchema,
  StageResultSchema,
  StageSchema,
  TaskEventSchema,
  TaskSchema,
  TelemetryConfigSchema,
  WorkflowStageSchema,
  WorkspaceSchema
};

export function validateSchema<T extends TSchema>(schema: T, value: unknown): value is Static<T> {
  const validator = ajv.compile(schema);
  return validator(value);
}

export function assertSchema<T extends TSchema>(schema: T, value: unknown): Static<T> {
  const validator = ajv.compile(schema);
  if (validator(value)) {
    return value as Static<T>;
  }

  const message = validator.errors
    ?.map((error: ErrorObject) => `${error.instancePath || "/"} ${error.message || "invalid"}`)
    .join("; ");
  throw new Error(`Schema validation failed: ${message || "unknown error"}`);
}
