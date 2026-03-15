import type { AppConfig, CompiledConfig, CompiledWorkflow, Project, Task } from "@deliverator/contracts";
import { timestampNow } from "@deliverator/shared";

export { compileWorkflowYaml, loadAndCompileWorkflow } from "./workflow.js";
export { initializeProductConfig } from "./init.js";

export function buildCompiledConfig(app: AppConfig, workflow: CompiledWorkflow): CompiledConfig {
  return {
    generatedAt: timestampNow(),
    app,
    workflow,
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
      stage: "build_test",
      attentionState: "actively_working",
      summary: "Bootstrap the monorepo, local stack, and observability baseline."
    },
    {
      id: "task-design-system",
      projectId,
      title: "Implement the design system",
      stage: "research",
      attentionState: "awaiting_human_approval",
      summary: "Set up Tailwind, shadcn/ui, and design tokens from DESIGN_SYSTEM.md."
    },
    {
      id: "task-board-ui",
      projectId,
      title: "Build the kanban board",
      stage: "inbox",
      attentionState: "paused_for_human",
      summary: "Create the primary operating surface with 7 stage columns."
    },
    {
      id: "task-workflow-engine",
      projectId,
      title: "Implement workflow state machine",
      stage: "discovery",
      attentionState: "actively_working",
      summary: "Build the deterministic stage transition engine with gate support."
    },
    {
      id: "task-artifact-indexer",
      projectId,
      title: "Build artifact indexer",
      stage: "inbox",
      attentionState: "paused_for_human",
      summary: "Index and serve immutable run evidence and canonical artifacts."
    },
    {
      id: "task-runner-mvp",
      projectId,
      title: "Runner MVP — execute agent actions",
      stage: "feedback",
      attentionState: "awaiting_human_input",
      summary: "Invoke CLI agents via subprocess with workspace isolation."
    },
    {
      id: "task-deploy-pipeline",
      projectId,
      title: "Deploy pipeline for completed tasks",
      stage: "done",
      attentionState: "ready_to_archive",
      summary: "Merge PR, cleanup worktree, archive evidence."
    }
  ];
}
