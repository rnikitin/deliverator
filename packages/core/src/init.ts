import fs from "node:fs";
import path from "node:path";

import { ensureDirectory } from "@deliverator/shared";

import { DEFAULT_PRODUCT_FILES } from "./defaults.js";

/**
 * Initialize the `.deliverator/` product configuration directory.
 *
 * Creates all default product config files (workflow, recipes, schemas,
 * prompts, validators) if they do not already exist. Existing files are
 * never overwritten — operators can customise them freely.
 *
 * Call this at startup before workflow compilation or any other init that
 * reads from `.deliverator/`.
 */
export function initializeProductConfig(repoRoot: string): void {
  const baseDir = path.join(repoRoot, ".deliverator");
  ensureDirectory(baseDir);

  for (const entry of DEFAULT_PRODUCT_FILES) {
    const targetPath = path.join(baseDir, entry.path);

    if (fs.existsSync(targetPath)) {
      continue;
    }

    ensureDirectory(path.dirname(targetPath));
    fs.writeFileSync(targetPath, entry.content, "utf8");
  }
}
