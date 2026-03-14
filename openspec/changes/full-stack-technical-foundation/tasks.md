## 1. Planning Artifacts

- [x] 1.1 Create the umbrella ExecPlan at `docs/plans/2026-03-14-full-stack-technical-foundation.md`.
- [x] 1.2 Create `proposal.md`, `design.md`, `tasks.md`, and the `technical-foundation` spec delta.
- [x] 1.3 Validate the drafted change with `openspec list` and `openspec validate full-stack-technical-foundation`.
- [x] 1.4 Pause for user review and approval before continuing implementation.

## 2. Workspace Bootstrap

- [x] 2.1 Add the root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, TypeScript config, lint config, test config, `.env.example`, `.gitignore`, `README.md`, and `Makefile` after approval.
- [x] 2.2 Add Docker and helper scripts for `make dev`, `make dev-start`, `make down`, `make down-all`, `make logs`, and `make smoke-services` after approval.

## 3. Packages

- [x] 3.1 Create `packages/contracts` with TypeBox schemas and shared types for domain, configuration, execution, and SSE payloads after approval.
- [x] 3.2 Create `packages/shared`, `packages/core`, `packages/db`, `packages/artifacts`, and `packages/runner` with real exports and initial tests after approval.
- [x] 3.3 Create initial adapter packages for `local-process`, `git-worktree`, `github-cli`, `codex-cli`, `claude-cli`, and `openspec-cli` after approval.

## 4. Server Application

- [x] 4.1 Create `apps/server` with Fastify, integrated Vite + React SPA, and the operator/task shell routes after approval.
- [x] 4.2 Implement `/healthz`, `/readyz`, `/api/config/compiled`, `/api/events/stream`, and `/api/metrics` after approval.
- [x] 4.3 Initialize OpenTelemetry before the app module is imported and add structured logging plus Prometheus metrics after approval.

## 5. Validation and Docs

- [x] 5.1 Run `openspec list` after implementation.
- [x] 5.2 Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` after implementation.
- [x] 5.3 Smoke-test `make dev` and the service endpoints after implementation. `make dev-start` and `make smoke-services` now pass, including the API routes, UI shell routes, SSE, and observability endpoints.
- [x] 5.4 Update `ARCHITECTURE.md`, `docs/index.md`, `README.md`, and `docs/CHANGELOG.md` after implementation.
