# ARCHITECTURE

This document is the short, stable codemap for DELIVERATOR. Keep it high level and point to deeper docs instead of turning it into an encyclopedia.

If you are new here, start with:
- `AGENTS.md`
- `CLAUDE.md`
- `docs/index.md`
- `docs/PLANS.md`

## Bird's-Eye View

DELIVERATOR is a workflow orchestration system for AI CLI agents. It owns the board, workflow state machine, approvals, run orchestration, artifact indexing, and evidence trail around automated work.

It is not a top-level autonomous agent. Workflow authority belongs to deterministic code, policies, and schemas.

## Intended System Shape

The research pack in `docs/research/` describes a larger target monorepo. The current repo-level implementation direction is:
- one Fastify application owns API routes, SSE, and site hosting
- Vite is integrated into the Fastify app and serves a client-rendered React SPA
- package boundaries are still important, but there is no separate frontend runtime in v1
- milestone 1 uses a client-rendered SPA by design
- SSR is intentionally out of scope for the current milestone and requires a new explicit architectural change decision if it is ever introduced

Expected major areas once implementation begins:
- `apps/server` for Fastify, API, SSE, and UI hosting
- `packages/core` for workflow types, schema/compiler logic, state transitions, and policies
- `packages/db` for SQLite schema, migrations, and repositories
- `packages/runner` for invocation bundles, process execution, and validation glue
- `packages/artifacts` for immutable evidence, artifact indexing, and canonical/snapshot resolution
- `packages/adapters/*` for agent, runtime, SCM, and project-command integrations

## System Layers

- Control plane:
  - projects
  - tasks
  - board state
  - stage transitions
  - approvals
  - comments and attachments
  - run scheduling
  - artifact indexing
- Execution plane:
  - workspaces
  - local process runs
  - docker compose environments
  - CLI tools such as `codex`, `claude`, `git`, `gh`, and `openspec`

The control plane decides what is allowed to run and why. The execution plane performs the work and emits evidence.

## Architectural Invariants

- Workflow transitions, approvals, retries, and policy gates stay deterministic.
- Workspace and artifact continuity matter more than chat/session continuity.
- Action intent, recipe composition, and adapter execution stay separated.
- Evidence is immutable even if workspaces are cleaned up later.
- Fastify owns API and site hosting in v1.
- UI work must remain responsive, accessible, and integrated into the single-site architecture.
- Significant UI/UX work should use the `frontend-design` skill before implementation.
- Non-trivial changes follow `docs/PLANS.md`, then `openspec/` when required by the change tier.

## Startup Sequence

`apps/server/src/main.ts` boots the server in this order:

1. `resolveRepoRoot()` + `loadAppConfig()` — resolve the repo root and load environment-driven config
2. `bootstrapTelemetry(config)` — initialize OpenTelemetry
3. `initializeProductConfig(rootDir)` — scaffold `.deliverator/` with default product config files (workflow, recipes, schemas, prompts, validators) if missing
4. `openDatabase(config.paths)` + `applyMigrations(dbContext)` — open SQLite and run migrations
5. `seedDevelopmentState(dbContext, rootDir)` — seed dev data (non-production only)
6. `loadAndCompileWorkflow(rootDir)` — read and compile `.deliverator/workflow.yaml` into memory
7. `createApp({ config, dbContext, workflow })` — create the Fastify instance with all routes, then `app.listen()`

Shutdown registers `SIGINT`/`SIGTERM` handlers that close the Fastify app and flush telemetry.

## Where to Go Deeper

- Knowledge base index: `docs/index.md`
- Planning and change management: `docs/PLANS.md`
- Implementation history: `docs/CHANGELOG.md`
- OpenSpec conventions: `openspec/project.md`
- Research pack: `docs/research/`
