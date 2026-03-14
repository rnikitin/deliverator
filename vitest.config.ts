import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@deliverator/contracts": path.join(rootDir, "packages/contracts/src/index.ts"),
      "@deliverator/shared": path.join(rootDir, "packages/shared/src/index.ts"),
      "@deliverator/core": path.join(rootDir, "packages/core/src/index.ts"),
      "@deliverator/db": path.join(rootDir, "packages/db/src/index.ts"),
      "@deliverator/artifacts": path.join(rootDir, "packages/artifacts/src/index.ts"),
      "@deliverator/runner": path.join(rootDir, "packages/runner/src/index.ts")
    }
  },
  test: {
    environment: "node",
    globals: true
  }
});
