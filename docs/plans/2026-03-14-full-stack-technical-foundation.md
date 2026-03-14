# Initialize the DELIVERATOR full-stack technical foundation with make dev

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `docs/PLANS.md`.

## Purpose / Big Picture

After this change, a developer can clone the repository, run `make dev`, and get one Docker-based development stack that serves the DELIVERATOR site, API, server-sent events (SSE), SQLite metadata storage, and a local observability stack. The resulting system is intentionally minimal but demonstrable: `GET /healthz` and `GET /readyz` return healthy responses, the root page and task page render through the same Fastify-hosted site, `/api/events/stream` emits bootstrap and heartbeat events, `/api/metrics` exposes Prometheus metrics, and Grafana, Tempo, Prometheus, and Loki receive data from the running app.

The technical goal is to turn a documentation-only repository into a working monorepo foundation without overbuilding the product. This change establishes the package boundaries, runtime bootstrap order, storage defaults, observability contract, and `make dev` ergonomics that later DELIVERATOR capabilities will build upon.

## Progress

- [x] (2026-03-14 15:20Z) Create the initial directory skeleton for `apps/server`, `packages/*`, `scripts/*`, `observability/*`, and `openspec/changes/full-stack-technical-foundation/`.
- [x] (2026-03-14 15:42Z) Create this ExecPlan and the corresponding OpenSpec change artifacts for the full-stack technical foundation.
- [x] (2026-03-14 16:18Z) Validate that the OpenSpec change parses with `openspec list` and `openspec validate full-stack-technical-foundation`.
- [x] (2026-03-14 19:10Z) Review checkpoint completed after user approval to continue from the ExecPlan and OpenSpec artifacts.
- [x] (2026-03-14 19:24Z) Bootstrap the root Node.js 22 + `pnpm` + `turbo` workspace with shared TypeScript, lint, test, and developer tooling.
- [x] (2026-03-14 19:43Z) Implement the unified Fastify + Vite server application with a client-rendered React SPA, health, readiness, compiled-config, metrics, and SSE routes.
- [x] (2026-03-14 19:28Z) Implement the initial `contracts`, `shared`, `core`, `db`, `artifacts`, `runner`, and adapter packages with real exports and smoke-testable behavior.
- [x] (2026-03-14 19:31Z) Implement the Docker-based `make dev` flow, observability stack, and local-path bootstrapping scripts.
- [ ] Validate the full Docker-based `make dev` smoke flow. The app, API, SSE, and package validations are complete, but Docker verification is blocked in this environment because the Docker daemon is unavailable.
- [x] (2026-03-14 19:45Z) Validate the workspace with `openspec list`, `pnpm typecheck`, `pnpm lint`, and `pnpm test`.
- [x] (2026-03-14 19:46Z) Update `README.md`, `ARCHITECTURE.md`, `docs/index.md`, and `docs/CHANGELOG.md` to reflect the real runtime layout.

## Surprises & Discoveries

- Observation: The repository is not yet a git repository.
  Evidence: `if [ -d .git ]; then git status; else echo 'no git repo'; fi` returned `no git repo`.

- Observation: `pnpm` is not installed globally, but `corepack` is available.
  Evidence: `pnpm --version` failed while `corepack --version` returned `0.14.2`.

- Observation: The existing DELIVERATOR harness already codifies the one-site Fastify + Vite decision and the requirement to use `frontend-design` only for substantial UI work.
  Evidence: `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `docs/PLANS.md`, and `openspec/project.md` all contain the same policy.

- Observation: OpenSpec already sees the drafted change and validates it as a change artifact set.
  Evidence: `openspec list` showed `full-stack-technical-foundation 2/14 tasks`, and `openspec validate full-stack-technical-foundation` returned `Change 'full-stack-technical-foundation' is valid`.

- Observation: `@fastify/react` added avoidable integration and typing friction for the milestone-one shell, while the user explicitly stated SSR was unnecessary.
  Evidence: the initial SSR attempt failed on renderer-module expectations and missing virtual-entry wiring, and the user then directed that SSR was not needed.

- Observation: Docker-based validation cannot be completed in this environment because the Docker daemon is unavailable.
  Evidence: `docker ps` failed with `Cannot connect to the Docker daemon at unix:///Users/rnikitin/.docker/run/docker.sock`.

## Decision Log

- Decision: Treat this work as one large Tier 2 change with one umbrella ExecPlan and one OpenSpec change.
  Rationale: The change spans runtime architecture, public routes, storage contracts, developer tooling, and observability, so splitting too early would introduce artificial sequencing overhead.
  Date/Author: 2026-03-14 / Codex

- Decision: Keep the DELIVERATOR application as one Fastify-hosted site with integrated Vite and no separate frontend container or dev server.
  Rationale: This is the explicit repo-level override already encoded in the harness and it matches the desired operator experience of one site rather than two independently hosted applications.
  Date/Author: 2026-03-14 / Codex

- Decision: Make `make dev` the primary local entrypoint and run the application in Docker during development.
  Rationale: The user requested `datamate-app`-style ergonomics where one command starts all supporting services, applies setup, and keeps the stack in watch mode.
  Date/Author: 2026-03-14 / Codex

- Decision: Drop SSR from the first UI milestone and keep the site as a client-rendered React SPA served by Fastify + Vite.
  Rationale: The user explicitly stated SSR is unnecessary, and removing `@fastify/react` produces a simpler, more robust one-site architecture for this milestone.
  Date/Author: 2026-03-14 / Codex

- Decision: Use Prometheus scraping for `/api/metrics`, OTLP for traces, and Pino JSON file shipping for logs.
  Rationale: This keeps the milestone-one observability setup simpler and matches the local Grafana + Tempo + Prometheus + Loki stack the user requested.
  Date/Author: 2026-03-14 / Codex

- Decision: Use repo-local paths during `make dev` while preserving `~/.deliverator/*` as the runtime default.
  Rationale: Dockerized development should not depend on host home-directory mounts, but production and host-run defaults should still reflect the product storage model from the research pack.
  Date/Author: 2026-03-14 / Codex

## Outcomes & Retrospective

Current stopping point: the monorepo foundation is implemented and the unified app now runs as one Fastify-hosted site with a Vite-managed React SPA, API routes, SSE, metrics, SQLite bootstrap, and shared packages. Workspace validation and host-run smoke checks are green. The only remaining validation gap is the full Docker-backed `make dev` smoke path, which could not be executed here because the Docker daemon is unavailable.

## Context and Orientation

The repository currently contains policy and research documents but no working application source code. The key orientation files are `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `docs/index.md`, `docs/PLANS.md`, `docs/CHANGELOG.md`, `openspec/config.yaml`, and `openspec/project.md`. Imported reference material lives under `docs/research/` and must remain read-only during this change.

This implementation will create a real monorepo. The top-level application lives in `apps/server/`. The domain and infrastructure packages live under `packages/`. In this repository, a "unified app" means that one Fastify process owns API routes, SSE, and site hosting, with Vite integrated into that process for React rendering and development hot reload. There is no separate `apps/web` runtime.

The term "observability stack" means the local Docker services that collect and display runtime telemetry. For this change, those services are the OpenTelemetry Collector, Tempo for traces, Prometheus for metrics, Loki for logs, Promtail for file-based log shipping, and Grafana for dashboards and search. The application itself remains the DELIVERATOR server container.

The term "worktree-local paths" means directories rooted under the repo-local `.deliverator/` directory, such as `.deliverator/data`, `.deliverator/worktrees`, `.deliverator/logs`, `.deliverator/observability/*`, and `.deliverator/ports.env`. The term "default runtime paths" means the product defaults rooted under `~/.deliverator/`, such as `~/.deliverator/data`.

## Plan of Work

The first milestone is the planning and workspace foundation. Create `docs/plans/2026-03-14-full-stack-technical-foundation.md` and the OpenSpec change under `openspec/changes/full-stack-technical-foundation/`. Add the root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, TypeScript configuration, lint/test configuration, `.env.example`, `.gitignore`, `README.md`, and `Makefile`. The workspace must explain how a novice starts the system and how the pieces fit together.

The second milestone is the package and runtime layer. Create `packages/contracts`, `packages/shared`, `packages/core`, `packages/db`, `packages/artifacts`, `packages/runner`, and the first adapter packages under `packages/adapters/`. Each package must export at least one real interface or helper. `packages/contracts` owns TypeBox-backed JSON Schemas and shared TypeScript types. `packages/core` owns deterministic workflow and compiled configuration helpers. `packages/db` owns SQLite connection, migrations, and bootstrap data. `packages/artifacts` owns path resolution. `packages/runner` owns invocation validation and adapter-facing runner interfaces.

The third milestone is the unified Fastify application. In `apps/server`, add the Fastify bootstrap, route registration, Vite integration, a client-rendered React SPA, and observability initialization. The startup order must be explicit: load configuration, initialize Node telemetry, then import and build the Fastify app. The HTTP routes in this milestone are `/healthz`, `/readyz`, `/api/config/compiled`, `/api/events/stream`, `/api/metrics`, `/`, and `/tasks/:taskId`.

The fourth milestone is the Dockerized developer workflow and observability stack. Add `Dockerfile.dev`, `docker-compose.dev.yml`, `docker-compose.obs.yml`, `scripts/setup.sh`, `scripts/local/up.sh`, `scripts/local/down.sh`, `scripts/local/dev-logs.sh`, `scripts/local/smoke-services.sh`, and `scripts/obs/up.sh`. `make dev` must ensure `.env`, generate `.deliverator/ports.env`, create the `.deliverator/` local-state tree, start observability, start the app stack, wait for health, and then switch to `docker compose up --watch`.

The fifth milestone is validation and documentation. Run the repo commands, verify the application and observability endpoints, and update `ARCHITECTURE.md`, `docs/index.md`, `README.md`, and `docs/CHANGELOG.md` so a new contributor can rely on the working layout instead of only the research pack.

## Concrete Steps

All commands below are run from `/Users/rnikitin/dev/deliverator` unless another directory is stated explicitly.

1. Create the planning artifacts and root configuration files:

       apply_patch ... docs/plans/2026-03-14-full-stack-technical-foundation.md
       apply_patch ... openspec/changes/full-stack-technical-foundation/proposal.md
       apply_patch ... openspec/changes/full-stack-technical-foundation/design.md
       apply_patch ... openspec/changes/full-stack-technical-foundation/tasks.md
       apply_patch ... openspec/changes/full-stack-technical-foundation/specs/technical-foundation/spec.md
       apply_patch ... package.json pnpm-workspace.yaml turbo.json tsconfig*.json .env.example Makefile README.md

2. Create package manifests and source files for the shared packages and adapters:

       apply_patch ... packages/contracts/package.json packages/contracts/tsconfig.json packages/contracts/src/index.ts
       apply_patch ... packages/shared/... packages/core/... packages/db/... packages/artifacts/... packages/runner/...
       apply_patch ... packages/adapters/local-process/... packages/adapters/git-worktree/... packages/adapters/github-cli/... packages/adapters/codex-cli/... packages/adapters/claude-cli/... packages/adapters/openspec-cli/...

3. Create the server application and Vite/React pages:

       apply_patch ... apps/server/package.json apps/server/tsconfig*.json apps/server/vite.config.ts
       apply_patch ... apps/server/src/*.ts apps/server/web/*
       apply_patch ... apps/server/test/*

4. Create Docker and observability assets:

       apply_patch ... Dockerfile.dev docker-compose.dev.yml docker-compose.obs.yml
       apply_patch ... observability/otel-collector/config.yaml observability/tempo.yaml observability/prometheus/prometheus.yml observability/loki-config.yaml observability/promtail/promtail.yml observability/grafana/provisioning/* observability/grafana/dashboards/*
       apply_patch ... scripts/setup.sh scripts/local/*.sh scripts/obs/up.sh
       chmod +x scripts/setup.sh scripts/local/up.sh scripts/local/down.sh scripts/local/dev-logs.sh scripts/local/smoke-services.sh scripts/obs/up.sh

5. Install dependencies and validate:

       corepack enable
       corepack prepare pnpm@10.10.0 --activate
       pnpm install
       openspec list
       pnpm typecheck
       pnpm lint
       pnpm test
       make down
       make dev
       make smoke-services

Expected success indicators include a healthy server, a rendered root page, an SSE bootstrap event, Prometheus metrics, and reachable Grafana, Tempo, Prometheus, and Loki endpoints.

## Validation and Acceptance

The current review gate is successful when the user reads this ExecPlan and the OpenSpec change and explicitly confirms that implementation may continue. The implementation validation that follows approval is successful when a novice can follow `README.md` and reproduce the working stack. Run `openspec list` and expect the change to parse. Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` and expect success with the initial package and application tests. Then run `make dev` and confirm that the application responds while Grafana, Prometheus, Tempo, and Loki are reachable on the ports written to `.deliverator/ports.env`.

The browser-visible proof of success is that visiting `http://127.0.0.1:<APP_PORT>/` renders the DELIVERATOR operator shell and visiting `http://127.0.0.1:<APP_PORT>/tasks/example-task` renders the task shell from the same server. The operator-visible proof of success is that `/api/config/compiled` returns a JSON configuration document, `/api/events/stream` emits a `bootstrap` event followed by `heartbeat` events, `/api/metrics` exposes Prometheus text metrics, and Grafana is prewired to query logs, metrics, and traces.

## Idempotence and Recovery

The bootstrap must be safe to rerun. `scripts/setup.sh` should create `.env` from `.env.example` only if the file does not already exist, and it should regenerate `.deliverator/ports.env` only when required. The database migration runner must keep a schema-migrations table so that rerunning migrations is harmless. The seed/bootstrap step must insert only missing rows.

If `make dev` fails during Docker startup, the recovery path is `make down` followed by another `make dev`. If the developer wants to remove Docker volumes for this worktree stack, `make down-all` is the destructive cleanup path. If no `.git` directory exists, path hashing must still create stable worktree identifiers so scripts do not fail.

## Artifacts and Notes

Important evidence snippets to capture while working:

    $ openspec list
    Changes:
      full-stack-technical-foundation     2/14 tasks

    $ openspec validate full-stack-technical-foundation
    Change 'full-stack-technical-foundation' is valid

These transcripts are the current proof that the planning artifacts exist and are parseable. The `make dev` and HTTP-route transcripts remain the expected implementation evidence after approval.

## Interfaces and Dependencies

Use Node.js 22, `pnpm`, `turbo`, TypeScript with `moduleResolution` set to `NodeNext`, Fastify, `@fastify/vite`, React, TypeBox, Ajv, `better-sqlite3`, `execa`, Pino, `prom-client`, and OpenTelemetry for Node and web tracing.

The end state must include the following package entry points:

In `packages/contracts/src/index.ts`, define exported schemas and types for `Stage`, `AttentionState`, `Project`, `Task`, `TaskEvent`, `Workspace`, `Run`, `ActionRun`, `Artifact`, `Comment`, `Attachment`, `Approval`, `InvocationBundle`, `ActionResult`, `StageResult`, `AppConfig`, `PathsConfig`, `TelemetryConfig`, and `CompiledConfig`.

In `packages/core/src/index.ts`, define deterministic helpers such as `buildCompiledConfig`, `listInitialTasks`, and workflow metadata derived from the contracts package.

In `packages/db/src/index.ts`, define `openDatabase`, `applyMigrations`, `seedDevelopmentState`, `getProjects`, and `getTaskById`.

In `packages/runner/src/index.ts`, define `RunnerDependencies`, `ExecutionAdapter`, `ScmAdapter`, `AgentAdapter`, and `createDryRunAction`.

In `apps/server/src/main.ts`, initialize telemetry first and only then import the Fastify application bootstrap. In `apps/server/src/app.ts`, create the Fastify instance, register Vite/React, register API routes, and return the server instance.

Revision note: updated the plan to add an explicit user review gate before further implementation and to reflect the actual current OpenSpec validation results.
