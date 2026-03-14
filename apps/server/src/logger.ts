import fs from "node:fs";
import path from "node:path";

import type { AppConfig } from "@deliverator/contracts";
import type { FastifyBaseLogger } from "fastify";
import pino from "pino";

export function createLogger(config: AppConfig): FastifyBaseLogger {
  const logFilePath = path.join(config.paths.logsDir, "deliverator-server.log");
  fs.mkdirSync(config.paths.logsDir, { recursive: true });

  const destination = pino.destination({
    dest: logFilePath,
    mkdir: true,
    sync: false
  });

  return pino(
    {
      level: config.nodeEnv === "development" ? "debug" : "info",
      base: undefined,
      mixin() {
        return {
          service: config.telemetry.serviceName,
          correlation_id: null,
          trace_id: null,
          task_id: null,
          run_id: null,
          action_run_id: null
        };
      }
    },
    pino.multistream([{ stream: process.stdout }, { stream: destination }])
  ) as FastifyBaseLogger;
}
