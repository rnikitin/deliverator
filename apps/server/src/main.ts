import { createRequire } from "node:module";

import { applyMigrations, openDatabase, seedDevelopmentState } from "@deliverator/db";

import { createApp } from "./app.js";
import { loadAppConfig, resolveRepoRoot } from "./config.js";
import { bootstrapTelemetry, shutdownTelemetry } from "./telemetry.js";

const require = createRequire(import.meta.url);

async function main(): Promise<void> {
  const rootDir = resolveRepoRoot();
  const config = loadAppConfig(rootDir, process.env);

  await bootstrapTelemetry(config);

  const dbContext = openDatabase(config.paths);
  applyMigrations(dbContext);

  if (config.nodeEnv !== "production") {
    seedDevelopmentState(dbContext, rootDir);
  }

  const app = await createApp({ config, dbContext });

  const shutdown = async () => {
    await app.close();
    await shutdownTelemetry();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  await app.listen({
    host: "0.0.0.0",
    port: config.port
  });

  app.log.info(
    {
      route: "/healthz",
      version: require("../package.json").version
    },
    "deliverator_server_started"
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
