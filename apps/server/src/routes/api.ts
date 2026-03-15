import { randomUUID } from "node:crypto";

import { ATTENTION_STATES, type AppConfig, type CompiledWorkflow } from "@deliverator/contracts";
import { buildCompiledConfig } from "@deliverator/core";
import { readinessSnapshot, type DatabaseContext, getAllTasksForBoard, getTaskById } from "@deliverator/db";
import type { FastifyInstance } from "fastify";

import type { AppMetrics } from "../metrics.js";

export interface ApiRouteDependencies {
  config: AppConfig;
  dbContext: DatabaseContext;
  metrics: AppMetrics;
  workflow: CompiledWorkflow;
}

export async function registerApiRoutes(app: FastifyInstance, dependencies: ApiRouteDependencies): Promise<void> {
  app.get("/healthz", async () => {
    return {
      ok: true,
      service: dependencies.config.telemetry.serviceName,
      time: new Date().toISOString()
    };
  });

  app.get("/readyz", async () => {
    return {
      ok: true,
      readiness: readinessSnapshot(dependencies.dbContext)
    };
  });

  app.get("/api/config/compiled", async () => {
    return buildCompiledConfig(dependencies.config, dependencies.workflow);
  });

  app.get("/api/board", async () => {
    const tasks = getAllTasksForBoard(dependencies.dbContext);
    const { stages, allowedMoves } = dependencies.workflow;

    const columns = stages.map((stage) => ({
      stageId: stage.id,
      label: stage.label,
      tasks: tasks.filter((t) => t.stage === stage.id)
    }));

    return { columns, allowedMoves };
  });

  app.get("/api/board/schema", async () => {
    return {
      stages: dependencies.workflow.stages,
      allowedMoves: dependencies.workflow.allowedMoves,
      attentionStates: ATTENTION_STATES
    };
  });

  app.get("/api/events/stream", async (request, reply) => {
    reply.hijack();
    reply.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");

    const correlationId = request.headers["x-correlation-id"]?.toString() || randomUUID();
    let tick = 0;

    const sendEvent = (eventName: string, data: Record<string, boolean | number | string>) => {
      reply.raw.write(`event: ${eventName}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent("bootstrap", {
      service: dependencies.config.telemetry.serviceName,
      status: "stream-open",
      correlation_id: correlationId
    });

    const heartbeat = setInterval(() => {
      tick += 1;
      sendEvent("heartbeat", { tick });
    }, 10_000);

    request.raw.on("close", () => {
      clearInterval(heartbeat);
      reply.raw.end();
    });
  });

  app.get("/api/metrics", async (_request, reply) => {
    reply.type(dependencies.metrics.registry.contentType);
    return dependencies.metrics.registry.metrics();
  });

  app.get("/api/tasks/:taskId", async (request, reply) => {
    const params = request.params as { taskId: string };
    const task = getTaskById(dependencies.dbContext, params.taskId);

    if (!task) {
      reply.code(404);
      return { ok: false, error: "task_not_found" };
    }

    return { ok: true, task };
  });
}
