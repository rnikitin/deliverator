import path from "node:path";
import { fileURLToPath } from "node:url";

import { AppConfigSchema, type AppConfig, assertSchema } from "@deliverator/contracts";
import { ensureRuntimeDirectories, resolveRuntimePaths } from "@deliverator/shared";

export function loadAppConfig(rootDir: string, env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = (env.NODE_ENV || "development") as AppConfig["nodeEnv"];
  const paths = ensureRuntimeDirectories(resolveRuntimePaths(rootDir, env));

  return assertSchema(AppConfigSchema, {
    nodeEnv,
    port: Number(env.PORT || "3000"),
    paths,
    telemetry: {
      serviceName: env.OTEL_SERVICE_NAME || "deliverator-server",
      otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT || "",
      browserTracingEnabled: env.NODE_ENV !== "test",
      metricsPath: "/api/metrics"
    }
  });
}

export function resolveRepoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
}
