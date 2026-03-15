import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AppConfig, CompiledWorkflow } from "@deliverator/contracts";
import type { DatabaseContext } from "@deliverator/db";
import FastifyVite from "@fastify/vite";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";

import { createLogger } from "./logger.js";
import { createMetrics } from "./metrics.js";
import { registerApiRoutes } from "./routes/api.js";

interface AppDependencies {
  config: AppConfig;
  dbContext: DatabaseContext;
  workflow: CompiledWorkflow;
}

type ViteReadyInstance = FastifyInstance & {
  vite: {
    ready(): Promise<void>;
  };
};

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function createApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const logger = createLogger(dependencies.config);
  const metrics = createMetrics();
  const app = Fastify({
    logger: false,
    loggerInstance: logger,
    disableRequestLogging: true
  });

  app.addHook("onRequest", async (request, reply) => {
    const correlationId = request.headers["x-correlation-id"]?.toString() || randomUUID();
    reply.header("x-correlation-id", correlationId);

    request.log.info(
      {
        correlation_id: correlationId,
        method: request.method,
        route: request.url
      },
      "request_started"
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions.url || request.url;
    const statusCode = String(reply.statusCode);
    const elapsedSeconds = (reply.elapsedTime || 0) / 1000;

    metrics.requestDuration.observe(
      {
        method: request.method,
        route,
        status_code: statusCode
      },
      elapsedSeconds
    );

    metrics.requestCounter.inc({
      method: request.method,
      route,
      status_code: statusCode
    });

    request.log.info(
      {
        correlation_id: reply.getHeader("x-correlation-id"),
        method: request.method,
        route,
        status_code: reply.statusCode
      },
      "request_completed"
    );
  });

  await app.register(FastifyVite, {
    root: serverRoot,
    dev: dependencies.config.nodeEnv !== "production",
    spa: true
  });

  await registerApiRoutes(app, {
    config: dependencies.config,
    dbContext: dependencies.dbContext,
    metrics,
    workflow: dependencies.workflow
  });

  // SPA catch-all — all non-API routes serve index.html for client-side routing
  app.get("/*", async (request, reply) => {
    if (request.url.startsWith("/api/")) {
      reply.code(404);
      return { ok: false, error: "not_found" };
    }
    return reply.html();
  });

  await (app as ViteReadyInstance).vite.ready();

  return app;
}
