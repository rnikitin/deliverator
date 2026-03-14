import type { AppConfig, AttentionState, CompiledConfig, Project, Stage, Task, WorkflowStage } from "@deliverator/contracts";
import { timestampNow } from "@deliverator/shared";

const workflowStages: WorkflowStage[] = [
  { id: "triage", label: "Triage", attentionState: "normal" },
  { id: "ready", label: "Ready", attentionState: "normal" },
  { id: "in_progress", label: "In Progress", attentionState: "normal" },
  { id: "review", label: "Review", attentionState: "needs_human" },
  { id: "blocked", label: "Blocked", attentionState: "waiting_on_dependency" },
  { id: "done", label: "Done", attentionState: "normal" }
];

export function getWorkflowStages(): WorkflowStage[] {
  return workflowStages;
}

export function getAttentionStateForStage(stage: Stage): AttentionState {
  return workflowStages.find((entry) => entry.id === stage)?.attentionState || "normal";
}

export function buildCompiledConfig(app: AppConfig): CompiledConfig {
  return {
    generatedAt: timestampNow(),
    app,
    stages: getWorkflowStages(),
    operatorShell: {
      title: "DELIVERATOR",
      subtitle: "Deterministic workflow orchestration for AI CLI agents"
    }
  };
}

export function createBootstrapProject(rootDir: string): Project {
  return {
    id: "project-deliverator",
    slug: "deliverator",
    name: "DELIVERATOR",
    repositoryPath: rootDir
  };
}

export function listInitialTasks(projectId: string): Task[] {
  return [
    {
      id: "task-foundation",
      projectId,
      title: "Initialize the technical foundation",
      stage: "in_progress",
      attentionState: "normal",
      summary: "Bootstrap the monorepo, local stack, and observability baseline."
    }
  ];
}
