import type { AppConfig, CompiledWorkflow, RegisteredProject } from "@deliverator/contracts";
import {
  applyProjectMigrations,
  applyRegistryMigrations,
  buildFeedEvents,
  getLastSelectedProjectSlug,
  getRegisteredProjectBySlug,
  listRegisteredProjects,
  listTaskEvents,
  openProjectDatabase,
  openRegistryDatabase,
  readinessSnapshot,
  registerProject,
  setLastSelectedProjectSlug,
  unregisterProject,
  type ProjectDatabaseContext,
  type RegistryDatabaseContext
} from "@deliverator/db";
import { initializeProjectConfig, loadAndCompileWorkflow } from "@deliverator/core";
import {
  ensureGlobalAppDirectories,
  ensureProjectDirectories,
  ensureProjectLocalIgnored,
  resolveProjectPaths,
  type GitignoreUpdateResult
} from "@deliverator/shared";

export interface ProjectRuntimeContext {
  project: RegisteredProject;
  workflow: CompiledWorkflow;
  dbContext: ProjectDatabaseContext;
}

export interface RegisterProjectResult {
  project: RegisteredProject;
  gitignore: GitignoreUpdateResult;
}

export class ProjectRegistryManager {
  private readonly registryContext: RegistryDatabaseContext;
  private readonly projectCache = new Map<string, ProjectRuntimeContext>();

  constructor(
    private readonly config: AppConfig,
    private readonly workspaceRoot: string
  ) {
    ensureGlobalAppDirectories(config.globalPaths);
    this.registryContext = openRegistryDatabase(config.globalPaths);
    applyRegistryMigrations(this.registryContext);
  }

  ensureDevelopmentProject(): RegisteredProject | null {
    const projects = listRegisteredProjects(this.registryContext);
    if (projects.length > 0 || this.config.nodeEnv === "production") {
      return projects[0] ?? null;
    }

    const result = this.registerProject({
      rootPath: this.workspaceRoot,
      name: "Deliverator Workspace"
    });
    return result.project;
  }

  listProjects(): RegisteredProject[] {
    return listRegisteredProjects(this.registryContext);
  }

  getLastSelectedProjectSlug(): string | null {
    return getLastSelectedProjectSlug(this.registryContext);
  }

  setLastSelectedProjectSlug(projectSlug: string): void {
    setLastSelectedProjectSlug(this.registryContext, projectSlug);
  }

  registerProject(input: { rootPath: string; name?: string; slug?: string }): RegisterProjectResult {
    const project = registerProject(this.registryContext, input);
    const gitignore = ensureProjectLocalIgnored(project.rootPath);
    const runtimeContext = this.createRuntimeContext(project);

    this.projectCache.set(project.slug, runtimeContext);
    setLastSelectedProjectSlug(this.registryContext, project.slug);

    return { project, gitignore };
  }

  unregisterProject(projectSlug: string): boolean {
    const cached = this.projectCache.get(projectSlug);
    if (cached) {
      cached.dbContext.db.close();
      this.projectCache.delete(projectSlug);
    }

    return unregisterProject(this.registryContext, projectSlug);
  }

  getProjectContext(projectSlug: string): ProjectRuntimeContext | null {
    const cached = this.projectCache.get(projectSlug);
    if (cached) {
      return cached;
    }

    const project = getRegisteredProjectBySlug(this.registryContext, projectSlug);
    if (!project) {
      return null;
    }

    const runtimeContext = this.createRuntimeContext(project);
    this.projectCache.set(projectSlug, runtimeContext);
    return runtimeContext;
  }

  getAllProjectContexts(): ProjectRuntimeContext[] {
    return this.listProjects()
      .map((project) => this.getProjectContext(project.slug))
      .filter((context): context is ProjectRuntimeContext => context !== null);
  }

  getReadiness() {
    return {
      registry: readinessSnapshot(this.registryContext),
      registeredProjects: this.listProjects().length,
      cachedProjects: this.projectCache.size,
      lastSelectedProjectSlug: this.getLastSelectedProjectSlug()
    };
  }

  listAggregatedFeed(limit = 20) {
    return this.getAllProjectContexts()
      .flatMap((context) => buildFeedEvents(context.project, listTaskEvents(context.dbContext, limit)))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  close(): void {
    for (const context of this.projectCache.values()) {
      context.dbContext.db.close();
    }
    this.projectCache.clear();
    this.registryContext.db.close();
  }

  private createRuntimeContext(project: RegisteredProject): ProjectRuntimeContext {
    const projectPaths = ensureProjectDirectories(resolveProjectPaths(project.rootPath));
    initializeProjectConfig(projectPaths, project.name, project.slug);

    const dbContext = openProjectDatabase(project, projectPaths);
    applyProjectMigrations(dbContext);

    return {
      project,
      workflow: loadAndCompileWorkflow(projectPaths),
      dbContext
    };
  }
}
