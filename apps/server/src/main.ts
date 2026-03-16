import { startServer, stopServer } from "./server.js";

async function main(): Promise<void> {
  const server = await startServer();

  const shutdown = async () => {
    await stopServer(server);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
