import type { AppConfig, DashboardData, FeedEvent } from "@deliverator/contracts";
import { ATTENTION_STATES } from "@deliverator/contracts";
import { buildCompiledConfig } from "@deliverator/core";
import { getTaskById, getTasksForBoard, listTaskEvents } from "@deliverator/db";
import { timestampNow } from "@deliverator/shared";
import { exec } from "node:child_process";
import fs from "node:fs";
import { platform } from "node:os";
import { promisify } from "node:util";
import type { FastifyInstance } from "fastify";

import type { ProjectRegistryManager, ProjectRuntimeContext } from "../project-manager.js";

export interface ApiRouteDependencies {
  config: AppConfig;
  projectManager: ProjectRegistryManager;
}

export async function registerApiRoutes(app: FastifyInstance, dependencies: ApiRouteDependencies): Promise<void> {
  app.get("/healthz", async () => {
    return {
      ok: true,
      service: dependencies.config.serviceName,
      time: timestampNow()
    };
  });

  app.get("/readyz", async () => {
    return {
      ok: true,
      readiness: dependencies.projectManager.getReadiness()
    };
  });

  app.get("/api/projects", async () => {
    return {
      projects: dependencies.projectManager.listProjects().map((project) => buildProjectSummary(project, dependencies.projectManager)),
      lastSelectedProjectSlug: dependencies.projectManager.getLastSelectedProjectSlug()
    };
  });

  app.post("/api/projects", async (request, reply) => {
    const body = (request.body || {}) as { rootPath?: string; name?: string; slug?: string };
    if (!body.rootPath) {
      reply.code(400);
      return { ok: false, error: "root_path_required" };
    }

    const result = dependencies.projectManager.registerProject({
      rootPath: body.rootPath,
      name: body.name,
      slug: body.slug
    });

    return {
      ok: true,
      project: result.project,
      gitignore: result.gitignore
    };
  });

  app.delete("/api/projects/:projectSlug", async (request, reply) => {
    const { projectSlug } = request.params as { projectSlug: string };
    const removed = dependencies.projectManager.unregisterProject(projectSlug);

    if (!removed) {
      reply.code(404);
      return { ok: false, error: "project_not_found" };
    }

    return { ok: true };
  });

  const execAsync = promisify(exec);

  app.post("/api/system/pick-folder", async () => {
    if (platform() !== "darwin") {
      return { path: null, error: "unsupported_platform" };
    }
    try {
      const { stdout } = await execAsync(
        `osascript -e 'POSIX path of (choose folder with prompt "Select project folder")'`
      );
      return { path: stdout.trim() };
    } catch {
      return { path: null };
    }
  });

  app.get("/api/dashboard", async () => {
    return buildDashboard(dependencies.projectManager);
  });

  app.get("/api/feed", async (request) => {
    return {
      events: dependencies.projectManager.listAggregatedFeed(resolveFeedLimit(request.query))
    };
  });

  app.get("/api/events/stream", async (request, reply) => {
    reply.hijack();
    reply.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");

    const correlationId = reply.getHeader("x-correlation-id") as string;
    let tick = 0;
    let closed = false;

    const stopHeartbeat = () => clearInterval(heartbeat);

    reply.raw.write(
      `event: bootstrap\ndata: ${JSON.stringify({
        service: dependencies.config.serviceName,
        status: "stream-open",
        projectSlug: "global",
        correlation_id: correlationId
      })}\n\n`
    );

    const heartbeat = setInterval(() => {
      if (closed) return;
      tick += 1;
      const ok = reply.raw.write(
        `event: heartbeat\ndata: ${JSON.stringify({ tick, projectSlug: "global" })}\n\n`
      );
      if (!ok) stopHeartbeat();
    }, 10_000);

    reply.raw.on("error", stopHeartbeat);
    request.raw.on("error", stopHeartbeat);
    request.raw.on("close", () => {
      if (closed) return;
      closed = true;
      stopHeartbeat();
      reply.raw.end();
    });
  });

  app.get("/api/projects/:projectSlug/config/compiled", async (request, reply) => {
    const context = getProjectContextOr404(
      dependencies.projectManager,
      (request.params as { projectSlug: string }).projectSlug,
      reply
    );
    if (!context) {
      return { ok: false, error: "project_not_found" };
    }

    dependencies.projectManager.setLastSelectedProjectSlug(context.project.slug);
    return buildCompiledConfig(dependencies.config, context.project, context.workflow);
  });

  app.get("/api/projects/:projectSlug/board", async (request, reply) => {
    const context = getProjectContextOr404(
      dependencies.projectManager,
      (request.params as { projectSlug: string }).projectSlug,
      reply
    );
    if (!context) {
      return { ok: false, error: "project_not_found" };
    }

    dependencies.projectManager.setLastSelectedProjectSlug(context.project.slug);
    const tasks = getTasksForBoard(context.dbContext);
    const tasksByStage = new Map<string, typeof tasks>();

    for (const task of tasks) {
      const bucket = tasksByStage.get(task.stage) ?? [];
      bucket.push(task);
      tasksByStage.set(task.stage, bucket);
    }

    return {
      project: context.project,
      columns: context.workflow.stages.map((stage) => ({
        stageId: stage.id,
        label: stage.label,
        tasks: tasksByStage.get(stage.id) ?? []
      })),
      allowedMoves: context.workflow.allowedMoves
    };
  });

  app.get("/api/projects/:projectSlug/board/schema", async (request, reply) => {
    const context = getProjectContextOr404(
      dependencies.projectManager,
      (request.params as { projectSlug: string }).projectSlug,
      reply
    );
    if (!context) {
      return { ok: false, error: "project_not_found" };
    }

    return {
      project: context.project,
      stages: context.workflow.stages,
      allowedMoves: context.workflow.allowedMoves,
      attentionStates: ATTENTION_STATES
    };
  });

  app.get("/api/projects/:projectSlug/tasks/:taskId", async (request, reply) => {
    const params = request.params as { projectSlug: string; taskId: string };
    const context = getProjectContextOr404(dependencies.projectManager, params.projectSlug, reply);
    if (!context) {
      return { ok: false, error: "project_not_found" };
    }

    dependencies.projectManager.setLastSelectedProjectSlug(context.project.slug);
    const task = getTaskById(context.dbContext, params.taskId);
    if (!task) {
      reply.code(404);
      return { ok: false, error: "task_not_found" };
    }

    return { ok: true, project: context.project, task };
  });
}

function getProjectContextOr404(
  projectManager: ProjectRegistryManager,
  projectSlug: string,
  reply: { code(statusCode: number): unknown }
): ProjectRuntimeContext | null {
  const context = projectManager.getProjectContext(projectSlug);
  if (!context) {
    reply.code(404);
    return null;
  }
  return context;
}

function buildProjectSummary(
  project: ReturnType<ProjectRegistryManager["listProjects"]>[number],
  projectManager: ProjectRegistryManager
) {
  const context = projectManager.getProjectContext(project.slug);
  if (!context) {
    return {
      ...project,
      summary: buildEmptyProjectSummary(project.rootPath)
    };
  }

  const tasks = getTasksForBoard(context.dbContext);
  const events = listTaskEvents(context.dbContext, 1);

  return {
    ...project,
    summary: {
      totalTasks: tasks.length,
      byStage: countTasksBy(tasks, "stage"),
      byAttention: countTasksBy(tasks, "attentionState"),
      lastActivityAt: events[0]?.createdAt ?? null,
      pathReachable: fs.existsSync(project.rootPath)
    }
  };
}

function buildEmptyProjectSummary(rootPath: string) {
  return {
    totalTasks: 0,
    byStage: {} as Record<string, number>,
    byAttention: {} as Record<string, number>,
    lastActivityAt: null as string | null,
    pathReachable: fs.existsSync(rootPath)
  };
}

function countTasksBy(
  tasks: ReturnType<typeof getTasksForBoard>,
  key: "stage" | "attentionState"
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const task of tasks) {
    const bucket = task[key];
    counts[bucket] = (counts[bucket] || 0) + 1;
  }
  return counts;
}

function resolveFeedLimit(query: unknown): number {
  const rawLimit = (query as { limit?: string | number }).limit;
  const limit = Number(rawLimit || 20);
  return Number.isFinite(limit) ? limit : 20;
}

function buildDashboard(projectManager: ProjectRegistryManager): DashboardData {
  const counts: Record<string, number> = {};
  const actionableItems: DashboardData["actionableItems"] = [];

  for (const context of projectManager.getAllProjectContexts()) {
    const tasks = getTasksForBoard(context.dbContext);
    counts.projects = (counts.projects || 0) + 1;
    counts.tasks = (counts.tasks || 0) + tasks.length;

    for (const task of tasks) {
      counts[`attention:${task.attentionState}`] = (counts[`attention:${task.attentionState}`] || 0) + 1;
      counts[`stage:${task.stage}`] = (counts[`stage:${task.stage}`] || 0) + 1;

      if (task.stage !== "done") {
        actionableItems.push({
          projectSlug: context.project.slug,
          projectName: context.project.name,
          taskId: task.id,
          title: task.title,
          stage: task.stage,
          attentionState: task.attentionState as DashboardData["actionableItems"][number]["attentionState"],
          summary: task.summary
        });
      }
    }
  }

  const recentEvents: FeedEvent[] = projectManager.listAggregatedFeed(20);
  return {
    counts,
    actionableItems: actionableItems.slice(0, 12),
    recentEvents
  };
}
