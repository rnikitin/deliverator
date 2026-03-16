import { loadAppConfig, resolveWorkspaceRoot } from "../config.js";
import { ProjectRegistryManager } from "../project-manager.js";

const config = loadAppConfig(process.env);
const manager = new ProjectRegistryManager(config, resolveWorkspaceRoot());
manager.ensureDevelopmentProject();

for (const context of manager.getAllProjectContexts()) {
  process.stdout.write(`Prepared ${context.project.slug} (${context.dbContext.filePath}).\n`);
}

manager.close();
