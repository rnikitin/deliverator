## ADDED Requirements

### Requirement: DELIVERATOR SHALL bootstrap as a single-site TypeScript monorepo

The repository SHALL provide a Node.js 22 + `pnpm` + `turbo` TypeScript monorepo whose primary local entrypoint is `make dev`. The monorepo SHALL contain one application runtime in `apps/server` and shared packages under `packages/`.

#### Scenario: Workspace commands exist for a new checkout
- **WHEN** a developer opens the repository root
- **THEN** the repository contains `package.json`, `pnpm-workspace.yaml`, `turbo.json`, a root TypeScript configuration, `.env.example`, `README.md`, and `Makefile`
- **AND** the `Makefile` exposes `setup`, `dev`, `dev-start`, `down`, `down-all`, `logs`, `smoke-services`, `test`, `lint`, and `typecheck`

### Requirement: DELIVERATOR SHALL run as one Fastify-hosted site

The initial runtime SHALL use one Fastify application that owns API routes, server-sent events, and site hosting. Vite and React SHALL be integrated into the Fastify app. The repository SHALL NOT introduce a second frontend runtime for this milestone.

#### Scenario: Root page and task page are served by the same server
- **WHEN** the developer starts the stack and requests `/` and `/tasks/example-task`
- **THEN** both responses are served by the Fastify-hosted site
- **AND** there is no separate frontend container or port required for those pages

### Requirement: DELIVERATOR SHALL expose technical-foundation health and telemetry endpoints

The initial server SHALL expose health, readiness, compiled-configuration, metrics, and SSE endpoints so developers can verify the foundation behavior.

#### Scenario: Health and readiness endpoints report server state
- **WHEN** `GET /healthz` is requested
- **THEN** the server returns HTTP 200 with a JSON body indicating liveness
- **AND** `GET /readyz` returns HTTP 200 only when the database and startup dependencies are ready

#### Scenario: SSE stream emits bootstrap and heartbeat events
- **WHEN** `GET /api/events/stream` is opened
- **THEN** the server returns `text/event-stream`
- **AND** the stream emits a `bootstrap` event immediately
- **AND** the stream emits periodic `heartbeat` events while the connection remains open

#### Scenario: Metrics endpoint is scrape-friendly
- **WHEN** `GET /api/metrics` is requested
- **THEN** the server returns Prometheus-format text metrics
- **AND** the response includes process and request metrics for the server

### Requirement: DELIVERATOR SHALL initialize core packages with real contracts

The monorepo SHALL provide working initial packages for contracts, shared utilities, deterministic core logic, SQLite bootstrap, artifact path resolution, runner interfaces, and initial adapters.

#### Scenario: Shared packages export real bootstrap behavior
- **WHEN** the packages are built and imported by `apps/server`
- **THEN** `packages/contracts` exports JSON Schemas and types for configuration, domain entities, and execution payloads
- **AND** `packages/db` can create and migrate a SQLite database
- **AND** `packages/core` can produce a compiled configuration used by `/api/config/compiled`
- **AND** the runner and adapter packages export real dry-run or command-construction helpers rather than empty placeholders

### Requirement: DELIVERATOR SHALL support Docker-first local development through make dev

The repository SHALL provide a Docker-first local developer workflow where `make dev` prepares local state, starts observability, starts the server stack, waits for health, and keeps the stack in watch mode.

#### Scenario: make dev bootstraps the local stack
- **WHEN** a developer runs `make dev` on a clean checkout
- **THEN** the repository creates `.env` when needed
- **AND** writes `.deliverator/ports.env` with a stable worktree identifier and free ports
- **AND** creates repo-local state directories under `.deliverator/` for data, worktrees, logs, and observability state
- **AND** starts the server and observability containers
- **AND** applies SQLite migrations and idempotent seed/bootstrap behavior
- **AND** waits until `/healthz` is healthy before finishing setup

#### Scenario: make dev works outside a git repository
- **WHEN** the repository root has no `.git` directory
- **THEN** the setup scripts still derive a stable project name and worktree identifier from the absolute path
- **AND** `make dev` does not fail solely because git metadata is unavailable

### Requirement: DELIVERATOR SHALL ship a local LGTM-style observability stack

The repository SHALL include Dockerized Tempo, Prometheus, Loki, Promtail, Grafana, and the OpenTelemetry Collector for local development.

#### Scenario: Observability stack receives traces, metrics, and logs
- **WHEN** the server handles at least one HTTP request after `make dev`
- **THEN** a trace for that request is exportable to Tempo through the collector
- **AND** Prometheus can scrape the server metrics endpoint
- **AND** structured JSON logs written by the app are available in Loki through Promtail
- **AND** Grafana has provisioned datasources for Prometheus, Tempo, and Loki
