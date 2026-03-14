import path from "node:path";
import { fileURLToPath } from "node:url";

import { viteFastify } from "@fastify/vite/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const serverRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(serverRoot, "web"),
  plugins: [viteFastify(), react()],
  server: {
    host: "0.0.0.0"
  },
  preview: {
    host: "0.0.0.0"
  }
});
