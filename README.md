# DELIVERATOR

DELIVERATOR is a workflow orchestration system for AI CLI agents. This repository now contains the first runnable technical foundation: one Fastify-hosted site, a Vite-managed React SPA, shared TypeScript packages, SQLite metadata storage, and a local observability stack.

## What This Repo Starts Today

- one Fastify application that owns the site, API, SSE, and metrics surface
- one Vite-managed React SPA mounted inside that Fastify application
- shared packages for contracts, deterministic core logic, SQLite bootstrap, artifacts, runner interfaces, and adapters
- Docker-first local development driven by `make dev`
- local Grafana, Tempo, Prometheus, Loki, Promtail, and OpenTelemetry Collector

The first UI shell is infrastructural. It exists to prove the runtime shape, not to ship the full product UX. The current UI is intentionally client-rendered; SSR is not part of this milestone.

## Prerequisites

- Node.js 22
- Docker with Compose support
- `corepack`

Expected local toolchain before you start:
- `node --version` should report Node 22
- `corepack --version` should work
- `pnpm --version` should work after Corepack activation

## Local Development

1. Enable `pnpm` through Corepack:

       corepack enable
       corepack prepare pnpm@10.10.0 --activate

2. Install dependencies:

       pnpm install

   First successful signal:
   - the command completes without errors
   - `node_modules/` and the workspace lockfile state are in sync
   - `pnpm typecheck` can run from the repo root

3. Start the full stack:

       make dev

The setup script creates `.env` from `.env.example` when needed, generates `.deliverator/ports.env`, creates the repo-local `.deliverator/` state tree, starts the application and observability containers, applies database migrations, seeds baseline development data, waits for `/healthz`, and then keeps the stack running in watch mode.

If you want the shortest validation path before entering watch mode, use:

    pnpm typecheck
    pnpm lint
    pnpm test
    make dev-start
    make smoke-services

Current validation note:
- the foundation code path has been validated host-run with `pnpm typecheck`, `pnpm lint`, `pnpm test`, HTTP smoke checks, and browser smoke checks
- the Docker-backed dev flow has also been validated with `make dev-start` and `make smoke-services` in an environment with a working local Docker daemon
- GitHub Actions runs `pnpm typecheck`, `pnpm lint`, and `pnpm test` on push and pull request; Docker-backed smoke is kept in a separate manual/nightly workflow instead of blocking every contribution

## Useful Commands

- `make dev` — full app + observability stack with watch
- `make dev-start` — full stack without watch
- `make down` — stop the current worktree stack
- `make down-all` — stop the stack and remove its volumes
- `make logs` — tail container logs
- `make smoke-services` — verify the app and observability endpoints
- `pnpm typecheck` — typecheck the workspace
- `pnpm lint` — lint the workspace
- `pnpm test` — run workspace tests

## Local Endpoints

All generated local runtime state is rooted under `.deliverator/` and is gitignored. This includes the development database, worktrees, logs, observability volume data, and generated ports file.

The exact ports are written to `.deliverator/ports.env`. The main ones are:

- `APP_PORT` — DELIVERATOR app and API
- `GRAFANA_PORT` — Grafana UI
- `PROMETHEUS_PORT` — Prometheus UI
- `LOKI_PORT` — Loki API
- `TEMPO_PORT` — Tempo API
- `OTLP_HTTP_PORT` — OpenTelemetry Collector OTLP HTTP receiver

Core application routes:

- `GET /healthz`
- `GET /readyz`
- `GET /api/config/compiled`
- `GET /api/events/stream`
- `GET /api/metrics`
- `GET /`
- `GET /tasks/:taskId`

## Troubleshooting

- If `pnpm` is not available, use Corepack first:

      corepack enable
      corepack prepare pnpm@10.10.0 --activate

- If `pnpm` still is not found after activating Corepack, open a new shell and re-run `pnpm --version` before continuing.

- `make dev` requires a running Docker daemon. If Docker is installed but not running, start Docker Desktop or your local daemon first.
- Expected success signals for `make dev`:
  - `.deliverator/ports.env` is generated
  - `.deliverator/` contains `data`, `worktrees`, `logs`, and `observability` subdirectories
  - `GET /healthz` returns HTTP 200
  - Grafana, Prometheus, Loki, and Tempo are reachable on the ports written to `.deliverator/ports.env`
- OpenSpec commands may print PostHog flush errors for `edge.openspec.dev` when telemetry egress is blocked. If `openspec list` or `openspec validate` still report success, treat that DNS/flush output as telemetry noise rather than a repo failure.

## Repository Layout

- `apps/server/` — Fastify + Vite + React SPA application
- `packages/contracts/` — JSON Schemas and shared types
- `packages/shared/` — common path, env, and utility helpers
- `packages/core/` — deterministic workflow and compiled config logic
- `packages/db/` — SQLite connection, migrations, and development seed
- `packages/artifacts/` — artifact and storage path helpers
- `packages/runner/` — runner interfaces and invocation validation
- `packages/adapters/*/` — initial runtime and tool adapters
- `observability/` — collector, Tempo, Prometheus, Loki, Promtail, and Grafana configs
- `scripts/` — setup, local, and observability helper scripts

## Planning and Change Management

This repo uses the three-tier planning model documented in `docs/PLANS.md`.

- trivial changes can stop at a short plan
- multi-step internal changes require an ExecPlan
- capability or architecture changes require both an ExecPlan and OpenSpec

For substantial UI or UX work, start with a design brief. If you are using the repository's AI workflows, that usually means the `frontend-design` skill before implementation.
