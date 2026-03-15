## MODIFIED Requirements

### Requirement: DELIVERATOR SHALL initialize core packages with real contracts

The monorepo SHALL provide working initial packages for contracts, shared utilities, deterministic core logic, SQLite bootstrap, artifact path resolution, runner interfaces, and initial adapters. The contracts package SHALL define `StageSchema` as `Type.String()` (stages are runtime-validated against the compiled workflow, not compile-time literals) and `AttentionStateSchema` as a fixed 7-value union of the research-defined attention states (`actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`). The compiled configuration produced by `packages/core` SHALL include compiled workflow data with stages, labels, and transitions loaded from `.deliverator/workflow.yaml`.

#### Scenario: Shared packages export real bootstrap behavior
- **WHEN** the packages are built and imported by `apps/server`
- **THEN** `packages/contracts` exports JSON Schemas and types for configuration, domain entities, and execution payloads
- **AND** `packages/contracts` exports `Stage` as `string` (runtime-validated, not a compile-time union)
- **AND** `packages/contracts` exports `AttentionState` as a union of the 7 research-defined attention state literals
- **AND** `packages/db` can create and migrate a SQLite database
- **AND** `packages/core` can produce a compiled configuration used by `/api/config/compiled` that includes compiled workflow data with stages from `.deliverator/workflow.yaml`
- **AND** the runner and adapter packages export real dry-run or command-construction helpers rather than empty placeholders

### Requirement: DELIVERATOR SHALL run as one Fastify-hosted site

The initial runtime SHALL use one Fastify application that owns API routes, server-sent events, and site hosting. Vite and React SHALL be integrated into the Fastify app. The repository SHALL NOT introduce a second frontend runtime for this milestone. The Fastify app SHALL register a catch-all SPA route after all API routes so that direct browser navigation to any client-side route returns the SPA HTML.

#### Scenario: Root page and task page are served by the same server
- **WHEN** the developer starts the stack and requests `/` and `/tasks/example-task`
- **THEN** both responses are served by the Fastify-hosted site
- **AND** there is no separate frontend container or port required for those pages

#### Scenario: All client-side routes are served by the catch-all
- **WHEN** the developer navigates directly to `/dashboard`, `/feed`, `/projects`, `/system`, or `/settings`
- **THEN** the server returns HTTP 200 with the SPA HTML
- **AND** the React Router renders the correct screen inside the AppShell

### Requirement: DELIVERATOR SHALL expose technical-foundation health and telemetry endpoints

The initial server SHALL expose health, readiness, compiled-configuration, metrics, and SSE endpoints so developers can verify the foundation behavior. The server SHALL additionally expose `GET /api/board` and `GET /api/board/schema` endpoints for the kanban board.

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

#### Scenario: Board endpoint returns task data
- **WHEN** `GET /api/board` is requested
- **THEN** the server returns HTTP 200 with a JSON body containing tasks grouped into 7 stage columns

## ADDED Requirements

### Requirement: Workflow YAML SHALL be auto-created with defaults if missing

When the server starts and `.deliverator/workflow.yaml` does not exist, `packages/core` SHALL create the file with a built-in default matching the research-defined 7-stage workflow (inbox, discovery, research, build_test, feedback, deploy, done) including stage labels, modes, and allowed manual transitions. The `.deliverator/` directory SHALL be created if it does not exist.

#### Scenario: Default workflow file is created on fresh checkout
- **WHEN** the server starts and `.deliverator/workflow.yaml` does not exist
- **THEN** the file is created with a default workflow containing 7 stages
- **AND** the server starts successfully using the auto-created workflow

#### Scenario: Existing workflow file is preserved
- **WHEN** the server starts and `.deliverator/workflow.yaml` already exists
- **THEN** the existing file is read without modification

### Requirement: Workflow SHALL be compiled at server startup

The `packages/core` workflow compiler SHALL read `.deliverator/workflow.yaml` at server startup and produce a `CompiledWorkflow` in-memory structure. The compiled workflow SHALL contain: an ordered array of stages (each with `id`, `label`, and `mode`), a map of allowed manual transitions per stage, and board column order. The compiled workflow SHALL be injected into the server's application context and available to all route handlers. The workflow is compiled once at startup — changes to the YAML require a server restart.

#### Scenario: Compiled workflow is available to route handlers
- **WHEN** the server starts successfully
- **THEN** the compiled workflow is accessible in the application context
- **AND** the compiled workflow contains an ordered stages array with id, label, and mode for each stage
- **AND** the compiled workflow contains an allowedMoves map

#### Scenario: Workflow compilation fails on invalid YAML
- **WHEN** `.deliverator/workflow.yaml` contains invalid YAML or missing required fields
- **THEN** the server logs a structured error describing the validation failure
- **AND** the server fails to start (does not silently fall back to defaults for a corrupt file)

### Requirement: Database migration SHALL update existing rows to new stage and attention values

A migration file (`002_reconcile_stages.sql`) SHALL update all existing rows in the `tasks` table to use the new stage and attention state values. The mapping SHALL be: `triage` → `inbox`, `ready` → `discovery`, `in_progress` → `build_test`, `review` → `feedback`, `blocked` → `inbox` (with attention state set to `blocked`), `done` → `done`. Attention state mapping: `normal` → `actively_working`, `needs_human` → `awaiting_human_input`, `waiting_on_dependency` → `paused_for_human`, `failed` → `blocked`. The migration SHALL also update stage values in the `runs` table.

#### Scenario: Migration maps old stages to new stages
- **WHEN** the migration runs on a database containing a task with stage `triage`
- **THEN** that task's stage is updated to `inbox`

#### Scenario: Migration maps old attention states to new attention states
- **WHEN** the migration runs on a database containing a task with attention state `needs_human`
- **THEN** that task's attention state is updated to `awaiting_human_input`

#### Scenario: Migration is idempotent
- **WHEN** the migration runs on a database that has already been migrated
- **THEN** no rows are changed (the old values no longer exist)

### Requirement: Seed script SHALL use the new stage and attention state vocabulary

The development seed script SHALL create bootstrap tasks using the new 7 stages and 7 attention states. Seed tasks SHALL be distributed across multiple stages to provide a realistic board view during development.

#### Scenario: Seeded tasks use new vocabulary
- **WHEN** `make dev` completes and the database is seeded
- **THEN** the tasks table contains rows with stages from the set `inbox`, `discovery`, `research`, `build_test`, `feedback`, `deploy`, `done`
- **AND** the tasks table contains rows with attention states from the set `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`

#### Scenario: Seeded tasks span multiple stages
- **WHEN** the database is freshly seeded
- **THEN** at least 3 different stages have at least one task
