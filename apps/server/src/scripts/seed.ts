import { loadAppConfig, resolveWorkspaceRoot } from "../config.js";
import { ProjectRegistryManager } from "../project-manager.js";

const config = loadAppConfig(process.env);
const manager = new ProjectRegistryManager(config, resolveWorkspaceRoot());
const result = manager.registerProject({
  rootPath: resolveWorkspaceRoot(),
  name: "Deliverator Workspace"
});

process.stdout.write(`Prepared project ${result.project.slug} at ${result.project.rootPath}.\n`);

manager.close();
