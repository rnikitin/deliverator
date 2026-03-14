# Design: Full-stack technical foundation with make dev

## Summary

DELIVERATOR will be bootstrapped as a TypeScript monorepo with one application runtime and several focused packages. The single application runtime is `apps/server`, which owns Fastify routes, site hosting, SSE, configuration reporting, and metrics exposition. React is integrated via Vite into that Fastify app. The repository keeps the architectural invariant that workflow authority lives in deterministic code, not in agent prompts.

The local development story is Docker-first. `make dev` creates the local env and ports files, creates worktree-local storage directories, starts the observability stack, starts the application container, applies SQLite migrations, waits for health, and then keeps the stack in watch mode.

## Architectural Constraints

- The one-site Fastify + Vite decision is a deliberate repo-level override of the older research-pack shape.
- `docs/research/` remains reference-only and is not the implementation surface.
- The state machine and workflow logic remain deterministic and testable.
- The first milestone does not add a second app runtime, a worker runtime, an ORM, GraphQL, or a top-level LLM controller.

## Package Ownership

### `packages/contracts`

Owns JSON Schemas and TypeScript types for the domain model, configuration model, execution bundles, stage results, and SSE payloads. Schemas are written with TypeBox and validated with Ajv at runtime boundaries.

### `packages/shared`

Owns repo-wide utility code such as path defaults, environment parsing helpers, slug/hash generation, and common constants.

### `packages/core`

Owns deterministic workflow primitives and the compiled application configuration built from default settings and environment overrides.

### `packages/db`

Owns SQLite connection management, WAL mode, schema migration execution, idempotent development seed/bootstrap behavior, and simple query helpers used by the server bootstrap.

### `packages/artifacts`

Owns path resolution for canonical storage roots, run artifact directories, snapshot directories, and log file paths.

### `packages/runner`

Owns the adapter-facing runner interfaces and invocation validation helpers. In this milestone, it supports dry-run execution planning and validation rather than the full workflow loop.

### `packages/adapters/*`

Owns initial adapter descriptors and dry-run command construction for local process execution, git worktree operations, GitHub CLI, Codex CLI, Claude CLI, and OpenSpec CLI.

## Runtime Boundaries

### Server runtime

`apps/server` is the only application runtime. It initializes telemetry before importing the Fastify app module. Once configuration and telemetry are ready, the app bootstrap creates the Fastify instance, registers Vite in SPA mode, registers API routes, and starts listening.

### Browser runtime

The browser mounts a Vite-managed React SPA for the operator shell and task shell and propagates minimal trace context for page loads and API fetches. It is not a second independent runtime. All HTML is served through the Fastify-hosted site, and SSR is intentionally out of scope for this milestone.

### Observability runtime

Observability services run in Docker via `docker-compose.obs.yml`. The app container exports traces to the host-published OTLP HTTP port, exposes metrics directly for Prometheus scraping, and writes JSON logs to `.deliverator/logs` for Promtail to ship. All repo-local generated runtime state for development is rooted under `.deliverator/`.

## Data Model and Storage

Default runtime paths remain:
- `~/.deliverator/data`
- `~/.deliverator/worktrees`
- `~/.deliverator/logs`

During `make dev`, these are overridden to:
- `.deliverator/data`
- `.deliverator/worktrees`
- `.deliverator/logs`

SQLite lives at `${DELIVERATOR_DATA_DIR}/deliverator.db`. Migrations are raw SQL files under `packages/db/migrations`. A `schema_migrations` table tracks applied files. WAL mode is enabled on connection startup.

The initial schema includes:
- `projects`
- `tasks`
- `task_events`
- `workspaces`
- `pull_requests`
- `runs`
- `action_runs`
- `artifacts`
- `comments`
- `attachments`
- `approvals`
- `leases`
- `reactions`

## HTTP Surface

The initial server API is intentionally narrow.

- `GET /healthz` returns process liveness data.
- `GET /readyz` returns database/readiness data.
- `GET /api/config/compiled` returns the compiled configuration and workflow metadata.
- `GET /api/events/stream` opens an SSE stream and emits a `bootstrap` event and periodic `heartbeat` events.
- `GET /api/metrics` exposes Prometheus-format metrics.
- `GET /` serves the SPA entrypoint for the operator shell.
- `GET /tasks/:taskId` serves the same SPA entrypoint and lets the client router render the task shell.

## Observability Design

The app uses OpenTelemetry Node SDK with OTLP HTTP trace export and automatic Node instrumentation. The server creates spans around application requests and critical initialization. The browser adds a minimal tracing layer for document load and API fetches. Pino JSON logging is used for application logs so Promtail can ship them to Loki with stable fields.

Required stable log fields:
- `service`
- `correlation_id`
- `trace_id`
- `task_id`
- `run_id`
- `action_run_id`

Metrics are exposed through `prom-client` on `/api/metrics`. Prometheus scrapes the server directly. Grafana is provisioned with Prometheus, Tempo, and Loki datasources plus a starter dashboard.

## Failure Modes and Recovery

- If `.git` is absent, worktree identity is derived from the absolute repository path rather than git metadata.
- If `.env` does not exist, `scripts/setup.sh` copies `.env.example`.
- If `.deliverator/ports.env` does not exist or is incomplete, `scripts/obs/up.sh --ports-only` regenerates it.
- If Docker services fail, `make down` followed by `make dev` is the retry path.
- If migrations partially fail, rerunning `pnpm --filter @deliverator/server db:migrate` is safe because applied files are tracked.

## Testing and Review Expectations

Tests are behavior-first:
- unit tests for contracts, core helpers, path resolution, and runner dry-run behavior
- integration tests for Fastify routes and SSE
- database tests for migration idempotence and seed behavior

Code review must confirm:
- no second application runtime was introduced
- `make dev` remains the primary entrypoint
- the observability stack is wired end-to-end
- public routes and contracts match the OpenSpec requirements
- the change stays infrastructural and does not accidentally scope-creep into a product UI redesign
