# ARCHITECTURE

This is the short codemap for DELIVERATOR.

## Bird's-Eye View

DELIVERATOR is a local-first workflow orchestration surface for AI CLI agents.

It is:
- deterministic in workflow authority
- project-scoped in board/task state
- global in dashboard/feed visibility

It is not:
- a top-level autonomous agent
- a Docker-managed local platform
- a split frontend/backend deployment in local development

## Runtime Shape

The current implementation direction is:
- one Fastify application owns API routes, SSE, and site hosting
- Vite serves a client-rendered React SPA inside that same app
- `apps/cli` owns the `deliverator` command surface
- global app state lives under `~/.deliverator`
- each managed project owns `<project>/.deliverator/shared` and `<project>/.deliverator/local`

## Major Areas

- `apps/cli/`
  - `deliverator start`
  - `deliverator open`
  - `deliverator logs`
- `apps/server/`
  - Fastify app
  - SPA hosting
  - API routes
  - SSE
- `packages/core/`
  - workflow defaults
  - workflow compilation
  - deterministic bootstrap/domain helpers
- `packages/db/`
  - registry DB
  - project DB access
  - migrations
  - feed/task queries
- `packages/shared/`
  - global path resolution
  - project path resolution
  - runtime metadata helpers
- `packages/contracts/`
  - shared types and schemas

## Storage Model

Global app state:

```text
~/.deliverator/
  data/registry.db
  run/current.json
  logs/app.jsonl
```

Per-project state:

```text
<project>/.deliverator/
  shared/
  local/
```

`shared/` is versionable.

`local/` is local-only runtime state.

## UI Model

- `/dashboard` is global
- `/feed` is global
- `/projects` manages the project registry
- `/projects/:projectSlug/board` is the canonical board
- `/projects/:projectSlug/tasks/:taskId` is the canonical task detail route

`/` redirects to the last selected project board when one exists, otherwise to `/projects`.

## Startup Sequence

Local startup is:

1. `deliverator start` or `bun run start`
2. resolve global paths under `~/.deliverator`
3. open and migrate the registry DB
4. seed a development project when the registry is empty in non-production mode
5. create the Fastify + Vite app
6. lazily resolve project contexts on demand
7. write the current runtime URL to `~/.deliverator/run/current.json`

## Invariants

- Workflow decisions stay deterministic.
- Fastify remains the only app server in v1.
- SSR is out of scope unless a new architectural change explicitly adds it.
- Docker is not part of the supported local runtime path.
- Structured JSONL logs are the supported local diagnostic layer.
