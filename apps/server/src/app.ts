import { randomUUID } from "node:crypto";
import path from "node:path";

import type { AppConfig } from "@deliverator/contracts";
import FastifyVite from "@fastify/vite";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";

import { createLogger } from "./logger.js";
import type { ProjectRegistryManager } from "./project-manager.js";
import { registerApiRoutes } from "./routes/api.js";

interface AppDependencies {
  config: AppConfig;
  projectManager: ProjectRegistryManager;
  workspaceRoot: string;
}

type ViteReadyInstance = FastifyInstance & {
  vite: {
    ready(): Promise<void>;
  };
};

function deriveLogContext(requestUrl: string): { project_slug: string | null; task_id: string | null } {
  const pathName = requestUrl.split("?")[0] || requestUrl;
  const projectTaskMatch = pathName.match(/^\/(?:api\/)?projects\/([^/]+)\/tasks\/([^/]+)/);
  if (projectTaskMatch) {
    return {
      project_slug: projectTaskMatch[1] ?? null,
      task_id: projectTaskMatch[2] ?? null
    };
  }

  const projectMatch = pathName.match(/^\/(?:api\/)?projects\/([^/]+)/);
  if (projectMatch) {
    return {
      project_slug: projectMatch[1] ?? null,
      task_id: null
    };
  }

  return {
    project_slug: null,
    task_id: null
  };
}

export async function createApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const logger = createLogger(dependencies.config);
  const appRoot = path.join(dependencies.workspaceRoot, "apps/server");
  const app = Fastify({
    logger: false,
    loggerInstance: logger,
    disableRequestLogging: true
  });

  const requestLogContext = new WeakMap<object, { project_slug: string | null; task_id: string | null }>();

  app.addHook("onRequest", async (request, reply) => {
    const correlationId = request.headers["x-correlation-id"]?.toString() || randomUUID();
    const routeContext = deriveLogContext(request.url);
    requestLogContext.set(request, routeContext);
    reply.header("x-correlation-id", correlationId);

    request.log.info(
      {
        correlation_id: correlationId,
        method: request.method,
        route: request.url,
        project_slug: routeContext.project_slug,
        task_id: routeContext.task_id
      },
      "request_started"
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    const routeContext = requestLogContext.get(request) ?? deriveLogContext(request.url);
    request.log.info(
      {
        correlation_id: reply.getHeader("x-correlation-id"),
        method: request.method,
        route: request.routeOptions.url || request.url,
        status_code: reply.statusCode,
        project_slug: routeContext.project_slug,
        task_id: routeContext.task_id
      },
      "request_completed"
    );
  });

  await app.register(FastifyVite, {
    root: appRoot,
    distDir: "web/dist",
    dev: dependencies.config.nodeEnv !== "production",
    spa: true
  });

  await registerApiRoutes(app, {
    config: dependencies.config,
    projectManager: dependencies.projectManager
  });

  app.get("/", async (_request, reply) => {
    const lastSelectedProjectSlug = dependencies.projectManager.getLastSelectedProjectSlug();
    return reply.redirect(lastSelectedProjectSlug ? `/projects/${lastSelectedProjectSlug}/board` : "/projects");
  });

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
