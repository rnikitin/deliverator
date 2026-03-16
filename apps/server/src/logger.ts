import path from "node:path";

import type { AppConfig } from "@deliverator/contracts";
import { ensureDirectory } from "@deliverator/shared";
import type { FastifyBaseLogger } from "fastify";
import pino from "pino";

export function createLogger(config: AppConfig): FastifyBaseLogger {
  const logFilePath = config.globalPaths.appLogFilePath || path.join(config.globalPaths.logsDir, "app.jsonl");
  ensureDirectory(path.dirname(logFilePath));
  const fileLogLevel = config.nodeEnv === "development" ? "debug" : "info";

  const destination = pino.destination({
    dest: logFilePath,
    mkdir: true,
    sync: false
  });

  return pino(
    {
      level: fileLogLevel,
      base: undefined,
      mixin: () => ({
        service: config.serviceName,
        correlation_id: null as string | null,
        trace_id: null as string | null,
        task_id: null as string | null,
        run_id: null as string | null,
        action_run_id: null as string | null
      })
    },
    destination
  ) as FastifyBaseLogger;
}
