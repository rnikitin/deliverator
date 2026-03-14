import { applyMigrations, openDatabase } from "@deliverator/db";

import { loadAppConfig, resolveRepoRoot } from "../config.js";

const rootDir = resolveRepoRoot();
const config = loadAppConfig(rootDir, process.env);
const dbContext = openDatabase(config.paths);
const applied = applyMigrations(dbContext);

process.stdout.write(`Applied ${applied} migrations to ${dbContext.filePath}.\n`);
