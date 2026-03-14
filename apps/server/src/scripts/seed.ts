import { openDatabase, seedDevelopmentState } from "@deliverator/db";

import { loadAppConfig, resolveRepoRoot } from "../config.js";

const rootDir = resolveRepoRoot();
const config = loadAppConfig(rootDir, process.env);
const dbContext = openDatabase(config.paths);
const result = seedDevelopmentState(dbContext, rootDir);

process.stdout.write(`Seeded ${result.insertedProjects} project(s) and ${result.insertedTasks} task(s).\n`);
