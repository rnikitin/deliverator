import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AppConfigSchema, type AppConfig, assertSchema } from "@deliverator/contracts";
import { ensureGlobalAppDirectories, resolveGlobalAppPaths } from "@deliverator/shared";

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = (env.NODE_ENV || "development") as AppConfig["nodeEnv"];
  const globalPaths = ensureGlobalAppDirectories(resolveGlobalAppPaths(env));

  return assertSchema(AppConfigSchema, {
    nodeEnv,
    port: Number(env.PORT || "0"),
    serviceName: env.DELIVERATOR_SERVICE_NAME || "deliverator-server",
    globalPaths
  });
}

export function resolveWorkspaceRoot(): string {
  let currentDir = path.dirname(fileURLToPath(import.meta.url));

  while (true) {
    const packageJsonPath = path.join(currentDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
          name?: string;
          workspaces?: unknown;
        };

        if (packageJson.name === "deliverator" || packageJson.workspaces) {
          return currentDir;
        }
      } catch {
        // Ignore malformed intermediate package.json files and continue upward.
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return process.cwd();
}
