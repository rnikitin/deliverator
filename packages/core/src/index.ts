import type { AppConfig, CompiledConfig, CompiledWorkflow, Project, RegisteredProject, Task } from "@deliverator/contracts";
import { deriveProjectName, deriveProjectSlug, deriveStableId, timestampNow } from "@deliverator/shared";

export { compileWorkflowYaml, loadAndCompileWorkflow } from "./workflow.js";
export { initializeProductConfig, initializeProjectConfig } from "./init.js";

export function buildCompiledConfig(
  app: AppConfig,
  project: RegisteredProject,
  workflow: CompiledWorkflow
): CompiledConfig {
  return {
    generatedAt: timestampNow(),
    app,
    project,
    workflow,
    operatorShell: {
      title: "DELIVERATOR",
      subtitle: "Deterministic workflow orchestration for AI CLI agents"
    }
  };
}

export function createBootstrapProject(rootDir: string, explicitName?: string): Project {
  const name = deriveProjectName(rootDir, explicitName);
  const slug = deriveProjectSlug(rootDir, explicitName);
  return {
    id: deriveStableId("project", rootDir),
    slug,
    name,
    repositoryPath: rootDir
  };
}

export function createRegisteredProject(rootDir: string, explicitName?: string): RegisteredProject {
  const project = createBootstrapProject(rootDir, explicitName);
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    rootPath: rootDir,
    createdAt: timestampNow()
  };
}

export function listInitialTasks(projectId: string): Task[] {
  return [
    {
      id: "task-foundation",
      projectId,
      title: "Register the first project",
      stage: "build_test",
      attentionState: "actively_working",
      summary: "Create the per-project Deliverator layout and verify the board loads through the registry."
    },
    {
      id: "task-workflow-shared",
      projectId,
      title: "Review the shared workflow",
      stage: "research",
      attentionState: "awaiting_human_approval",
      summary: "Customize <project>/.deliverator/shared/workflow.yaml for this repository."
    },
    {
      id: "task-board-polish",
      projectId,
      title: "Shape the project board",
      stage: "inbox",
      attentionState: "paused_for_human",
      summary: "Tune board columns, summaries, and project-specific context for daily use."
    },
    {
      id: "task-workflow-engine",
      projectId,
      title: "Refine workflow automation",
      stage: "discovery",
      attentionState: "actively_working",
      summary: "Connect project-scoped actions, recipes, and approvals to the shared workflow."
    },
    {
      id: "task-artifact-hygiene",
      projectId,
      title: "Set artifact retention rules",
      stage: "inbox",
      attentionState: "paused_for_human",
      summary: "Define which project artifacts stay in .deliverator/local and which summaries belong in shared state."
    },
    {
      id: "task-cli-ops",
      projectId,
      title: "Harden the CLI workflow",
      stage: "feedback",
      attentionState: "awaiting_human_input",
      summary: "Validate start/open/logs flows and capture operator feedback on portability."
    },
    {
      id: "task-archive-ready",
      projectId,
      title: "Archive completed work",
      stage: "done",
      attentionState: "ready_to_archive",
      summary: "Close finished tasks once artifacts and feedback have been captured."
    }
  ];
}
