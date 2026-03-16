import fs from "node:fs";
import path from "node:path";

import {
  deriveProjectName,
  deriveProjectSlug,
  ensureDirectory,
  resolveProjectPaths,
  type ProjectPaths
} from "@deliverator/shared";

import { DEFAULT_PRODUCT_FILES, buildDefaultProjectYaml } from "./defaults.js";

/**
 * Initialize the `<project>/.deliverator/shared/` configuration directory.
 *
 * Creates all default project config files (workflow, recipes, schemas,
 * prompts, validators) if they do not already exist. Existing files are
 * never overwritten — operators can customise them freely.
 *
 * Call this at startup before workflow compilation or any other init that
 * reads from the shared project tree.
 */
export function initializeProjectConfig(
  input: string | ProjectPaths,
  explicitName?: string,
  explicitSlug?: string
): ProjectPaths {
  const projectPaths = typeof input === "string" ? resolveProjectPaths(input) : input;
  const projectName = deriveProjectName(projectPaths.rootPath, explicitName);
  const projectSlug = explicitSlug || deriveProjectSlug(projectPaths.rootPath, explicitName);
  const baseDir = projectPaths.sharedDir;

  ensureDirectory(baseDir);

  for (const entry of DEFAULT_PRODUCT_FILES) {
    const targetPath = path.join(baseDir, entry.path);

    if (fs.existsSync(targetPath)) {
      continue;
    }

    ensureDirectory(path.dirname(targetPath));
    const content =
      entry.path === "project.yaml" ? buildDefaultProjectYaml(projectName, projectSlug) : entry.content;
    fs.writeFileSync(targetPath, content, "utf8");
  }

  return projectPaths;
}

export const initializeProductConfig = initializeProjectConfig;
