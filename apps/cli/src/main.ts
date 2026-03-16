#!/usr/bin/env node

import fs from "node:fs";
import { spawn } from "node:child_process";
import process from "node:process";

import { listRegisteredProjects, openRegistryDatabase } from "@deliverator/db";
import { startServer, stopServer } from "@deliverator/server";
import {
  readRuntimeState,
  resolveGlobalAppPaths,
  resolveProjectPaths,
  writeRuntimeState
} from "@deliverator/shared";

type Command = "start" | "open" | "logs";

interface LogFilters {
  grep?: string;
  level?: string;
  project?: string;
  task?: string;
  run?: string;
  follow: boolean;
}

interface RuntimePreferences {
  preferredPort: number;
}

async function main(): Promise<void> {
  const command = (process.argv[2] || "start") as Command;

  switch (command) {
    case "start":
      await runStart();
      return;
    case "open":
      await runOpen();
      return;
    case "logs":
      await runLogs(process.argv.slice(3));
      return;
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      process.exit(1);
  }
}

async function runStart(): Promise<void> {
  const globalPaths = resolveGlobalAppPaths(process.env);
  const requestedPort = readNumericFlag("--port");
  const preferredPort = requestedPort ?? readPreferredPort(globalPaths) ?? 0;
  const server = await startServerWithRetry(preferredPort, requestedPort !== undefined);

  writeRuntimeState(server.config.globalPaths, {
    pid: process.pid,
    port: server.port,
    url: server.url,
    startedAt: new Date().toISOString()
  });
  writePreferredPort(server.config.globalPaths, { preferredPort: server.port });

  printWelcome(server.url);

  const shutdown = async () => {
    clearRuntimeStateFile(server.config.globalPaths.runtimeStatePath);
    await stopServer(server);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

async function runOpen(): Promise<void> {
  const globalPaths = resolveGlobalAppPaths(process.env);
  const runtimeState = readRuntimeState(globalPaths);

  if (!runtimeState) {
    throw new Error("No running DELIVERATOR instance found. Start one with `deliverator start`.");
  }

  const healthResponse = await fetch(`${runtimeState.url}/healthz`);
  if (!healthResponse.ok) {
    throw new Error(`Current DELIVERATOR instance is unreachable at ${runtimeState.url}.`);
  }

  process.stdout.write(`${runtimeState.url}\n`);
  openBrowser(runtimeState.url);
}

async function runLogs(args: string[]): Promise<void> {
  const filters = parseLogFilters(args);
  const globalPaths = resolveGlobalAppPaths(process.env);
  const logPaths = resolveLogPaths(globalPaths);

  if (logPaths.length === 0) {
    process.stdout.write(`No logs found under ${globalPaths.logsDir}\n`);
    return;
  }

  const cursors = new Map<string, number>();
  for (const logPath of logPaths) {
    const nextCursor = printMatchingLogLines(logPath, 0, filters);
    cursors.set(logPath, nextCursor);
  }

  if (!filters.follow) {
    return;
  }

  for (const logPath of logPaths) {
    fs.watchFile(logPath, { interval: 500 }, () => {
      const cursor = cursors.get(logPath) ?? 0;
      cursors.set(logPath, printMatchingLogLines(logPath, cursor, filters));
    });
  }
}

function printMatchingLogLines(logPath: string, cursor: number, filters: LogFilters): number {
  const fileContent = fs.readFileSync(logPath, "utf8");
  const nextCursor = fileContent.length;
  const chunk = fileContent.slice(cursor);
  const lines = chunk.split(/\r?\n/).filter(Boolean);

  for (const line of lines) {
    if (matchesLogFilters(line, filters)) {
      process.stdout.write(`${line}\n`);
    }
  }

  return nextCursor;
}

function matchesLogFilters(line: string, filters: LogFilters): boolean {
  if (filters.grep && !line.includes(filters.grep)) {
    return false;
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = JSON.parse(line) as Record<string, unknown>;
  } catch {
    process.stderr.write(`Skipping malformed JSONL line in logs: ${line.slice(0, 120)}\n`);
    return !filters.level && !filters.project && !filters.task && !filters.run;
  }

  if (filters.level && payload.level !== filters.level) {
    return false;
  }
  if (filters.project && payload.project_slug !== filters.project) {
    return false;
  }
  if (filters.task && payload.task_id !== filters.task) {
    return false;
  }
  if (filters.run && payload.run_id !== filters.run) {
    return false;
  }

  return true;
}

function resolveLogPaths(globalPaths: ReturnType<typeof resolveGlobalAppPaths>): string[] {
  const logPaths = new Set<string>();
  if (fs.existsSync(globalPaths.appLogFilePath)) {
    logPaths.add(globalPaths.appLogFilePath);
  }

  if (!fs.existsSync(globalPaths.registryDbPath)) {
    return [...logPaths];
  }

  try {
    const registryContext = openRegistryDatabase(globalPaths);
    try {
      for (const project of listRegisteredProjects(registryContext)) {
        const projectLogDir = resolveProjectPaths(project.rootPath).logsDir;
        if (!fs.existsSync(projectLogDir)) {
          continue;
        }

        for (const entry of fs.readdirSync(projectLogDir)) {
          if (entry.endsWith(".jsonl")) {
            logPaths.add(`${projectLogDir}/${entry}`);
          }
        }
      }
    } finally {
      registryContext.db.close();
    }
  } catch {
    return [...logPaths];
  }

  return [...logPaths];
}

function parseLogFilters(args: string[]): LogFilters {
  return {
    grep: readStringFlag(args, "--grep"),
    level: readStringFlag(args, "--level"),
    project: readStringFlag(args, "--project"),
    task: readStringFlag(args, "--task"),
    run: readStringFlag(args, "--run"),
    follow: args.includes("--follow")
  };
}

async function startServerWithRetry(port: number, explicitPort: boolean) {
  const attempts = port > 0 ? 6 : 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await startServer({
        env: process.env,
        port
      });
    } catch (error) {
      if (!isAddressInUseError(error) || attempt === attempts) {
        throw formatStartError(error, port, explicitPort);
      }

      await wait(200);
    }
  }

  throw new Error("DELIVERATOR could not start.");
}

function printWelcome(url: string): void {
  process.stdout.write(
    ["", "DELIVERATOR", "  status  running", `  url     ${url}`, "  logs    bun run logs -- --follow", ""].join(
      "\n"
    )
  );
}

function readPreferredPort(globalPaths: ReturnType<typeof resolveGlobalAppPaths>): number | null {
  const preferencesPath = getRuntimePreferencesPath(globalPaths);
  if (!fs.existsSync(preferencesPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(preferencesPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<RuntimePreferences>;
    if (typeof parsed.preferredPort === "number" && parsed.preferredPort > 0) {
      return parsed.preferredPort;
    }
  } catch {
    return null;
  }

  return null;
}

function writePreferredPort(
  globalPaths: ReturnType<typeof resolveGlobalAppPaths>,
  preferences: RuntimePreferences
): void {
  fs.mkdirSync(globalPaths.runDir, { recursive: true });
  fs.writeFileSync(getRuntimePreferencesPath(globalPaths), JSON.stringify(preferences, null, 2), "utf8");
}

function getRuntimePreferencesPath(globalPaths: ReturnType<typeof resolveGlobalAppPaths>): string {
  return `${globalPaths.runDir}/preferences.json`;
}

function isAddressInUseError(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE");
}

function formatStartError(error: unknown, port: number, explicitPort: boolean): Error {
  if (!isAddressInUseError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const baseMessage =
    port > 0
      ? `DELIVERATOR could not start because port ${port} is already in use.`
      : "DELIVERATOR could not start because the selected port is already in use.";

  const nextStep = explicitPort
    ? "Choose a different port with `bun run start -- --port <port>`."
    : "If another DELIVERATOR instance is already running, reuse it with `bun run open`. Otherwise choose a different port with `bun run start -- --port <port>`.";

  return new Error(`${baseMessage} ${nextStep}`);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readNumericFlag(flag: string): number | undefined {
  const value = readStringFlag(process.argv.slice(3), flag);
  if (!value) {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function readStringFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  const next = args[index + 1];
  return next && !next.startsWith("--") ? next : undefined;
}

function openBrowser(url: string): void {
  if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }

  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }

  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

function clearRuntimeStateFile(runtimeStatePath: string): void {
  if (fs.existsSync(runtimeStatePath)) {
    fs.rmSync(runtimeStatePath, { force: true });
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
