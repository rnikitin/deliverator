# Change: Initialize the full-stack technical foundation with make dev

## Why

DELIVERATOR currently has architecture research and repository policy, but no runnable codebase. We need a real technical foundation that turns the repository into a working monorepo with one Fastify-hosted site, deterministic domain packages, SQLite storage, and a local observability stack. The developer experience must center on `make dev` so a contributor can start the full local environment in one step, matching the ergonomics already proven in `datamate-app`.

## What Changes

- Put the change behind an explicit review checkpoint: the ExecPlan and OpenSpec artifacts are prepared first and implementation continues only after user approval.
- Initialize the Node.js 22 + `pnpm` + `turbo` workspace, root TypeScript config, lint/test setup, `README.md`, `.env.example`, `Makefile`, and developer scripts.
- Add the umbrella ExecPlan at `docs/plans/2026-03-14-full-stack-technical-foundation.md`.
- Create `apps/server` as the only application runtime, using Fastify with integrated Vite and a client-rendered React SPA.
- Add HTTP routes for `/healthz`, `/readyz`, `/api/config/compiled`, `/api/events/stream`, `/api/metrics`, `/`, and `/tasks/:taskId`.
- Create real packages for `contracts`, `shared`, `core`, `db`, `artifacts`, `runner`, and the first adapter packages.
- Implement SQLite migrations and idempotent development bootstrap data.
- Add the Docker-based `make dev` flow and the local OpenTelemetry, Tempo, Prometheus, Loki, Promtail, and Grafana stack.
- Update architecture and onboarding docs so the repo documents the real runtime layout instead of only the research intent.

## Non-Goals

- Implement the full board workflow engine, agent loop orchestration, or approval UX.
- Introduce a second runtime such as `apps/web` or a dedicated worker container.
- Replace SQLite with Postgres or add Temporal in this milestone.
- Perform a major UI or UX redesign. The first shell is infrastructural and should not trigger `frontend-design`.

## Impact

- Affected specs:
  - `technical-foundation`
- Affected docs:
  - `README.md`
  - `ARCHITECTURE.md`
  - `docs/index.md`
  - `docs/CHANGELOG.md`
  - `docs/plans/2026-03-14-full-stack-technical-foundation.md`
- Affected code:
  - `apps/server/*`
  - `packages/*`
  - `scripts/*`
  - `docker-compose.dev.yml`
  - `docker-compose.obs.yml`
  - `Dockerfile.dev`
  - `observability/*`

## Build Order and Risk

This is an early-phase foundation change that aligns with the build-order guidance in `docs/research/docs/12-mvp-and-build-order.md`: start with the runtime spine, contracts, storage, and observability before implementing later product surfaces.

Current checkpoint:
- the planning artifacts are ready for review
- implementation should not proceed until the user confirms the direction

Primary risks:
- package version or integration mismatches between Fastify, Vite, and React
- Docker watch ergonomics with a monorepo and `pnpm`
- telemetry initialization order for a Node server that hosts a browser-rendered SPA
- keeping the initial implementation minimal enough that it remains reviewable

Mitigations:
- keep the first UI shell intentionally small
- make each package export only the initial contract surface
- prefer repo-local dev paths during Docker development
- validate the stack with behavior-level commands (`make dev`, `curl`, `pnpm test`) rather than only compilation
