import type { AppConfig } from "@deliverator/contracts";

import { createApp } from "./app.js";
import { loadAppConfig, resolveWorkspaceRoot } from "./config.js";
import { ProjectRegistryManager } from "./project-manager.js";

export interface RunningServer {
  app: Awaited<ReturnType<typeof createApp>>;
  config: AppConfig;
  projectManager: ProjectRegistryManager;
  port: number;
  url: string;
}

export async function startServer(options: {
  env?: NodeJS.ProcessEnv;
  port?: number;
  workspaceRoot?: string;
} = {}): Promise<RunningServer> {
  const config = resolveServerConfig(options);
  const workspaceRoot = options.workspaceRoot || resolveWorkspaceRoot();
  const projectManager = new ProjectRegistryManager(config, workspaceRoot);
  projectManager.ensureDevelopmentProject();

  const app = await createApp({ config, projectManager, workspaceRoot });

  await app.listen({
    host: "127.0.0.1",
    port: config.port,
    listenTextResolver: () => ""
  });

  const port = resolveListeningPort(app.server.address(), config.port);
  const url = `http://127.0.0.1:${port}`;

  return {
    app,
    config,
    projectManager,
    port,
    url
  };
}

export async function stopServer(server: RunningServer): Promise<void> {
  await server.app.close();
  server.projectManager.close();
}

function resolveServerConfig(options: {
  env?: NodeJS.ProcessEnv;
  port?: number;
}): AppConfig {
  const baseConfig = loadAppConfig(options.env);
  return {
    ...baseConfig,
    port: options.port ?? baseConfig.port
  };
}

function resolveListeningPort(address: ReturnType<RunningServer["app"]["server"]["address"]>, fallbackPort: number): number {
  if (typeof address === "object" && address && "port" in address) {
    return Number(address.port);
  }
  return fallbackPort;
}
