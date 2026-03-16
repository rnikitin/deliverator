# Introduce per-project runtime state, global registry, and a Bun-backed CLI-first workflow

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `docs/PLANS.md`.

## Purpose / Big Picture

After this change, DELIVERATOR stops behaving like a single hardcoded project rooted at the app repository and instead becomes a global operator surface over many registered projects. Adding a project means pointing DELIVERATOR at a filesystem path. DELIVERATOR then creates `<project>/.deliverator/shared` for versionable workflow and shared config, and `<project>/.deliverator/local` for the SQLite database, logs, worktrees, artifacts, and other local runtime state.

The runtime contract also changes. DELIVERATOR should no longer depend on Docker or a large local observability stack. Instead, a user runs `deliverator start`, the application creates `~/.deliverator`, starts the web server on a random free port, writes runtime metadata under `~/.deliverator/run/current.json`, and prints the hosted URL. `deliverator open` reads that runtime metadata, prints the current URL, and opens it in the browser. Structured JSONL logs become the main local observability surface, with a searchable CLI log command instead of Grafana, Tempo, Prometheus, and Loki. Under the hood, Bun becomes the package manager and primary command runner, while contributor watch mode moves to a Bun-backed `bun run dev` flow.

## Progress

- [x] (2026-03-16 09:35Z) Explore the current single-project runtime, routing, workflow loading, and SQLite layout.
- [x] (2026-03-16 09:48Z) Resolve the core architectural choices for the new model: per-project database as source of truth, runtime fan-out for global dashboard/feed, breaking cutover from the single-project layout, and auto-management of `.gitignore` for `.deliverator/local/`.
- [x] (2026-03-16 10:05Z) Draft the initial ExecPlan and OpenSpec artifacts for `per-project-runtime-and-registry`.
- [x] (2026-03-16 10:30Z) Revise the plan to move all global app state into `~/.deliverator`.
- [x] (2026-03-16 10:45Z) Revise the plan again to remove Docker and the local observability stack in favor of a CLI-first runtime and searchable JSONL logs.
- [x] (2026-03-16 11:20Z) Revise the plan to adopt Bun as the tooling/command layer, add a Bun-backed watch-mode dev flow, and split product vs development docs.
- [x] (2026-03-16 11:25Z) Stop for explicit user review of the ExecPlan and OpenSpec artifacts before implementation.
- [x] (2026-03-16 12:40Z) Add the global registry storage under `~/.deliverator` and project path helpers.
- [x] (2026-03-16 13:20Z) Add the CLI runtime (`deliverator start`, `deliverator open`, `deliverator logs`), the Bun-backed contributor watch flow, and remove the Docker-first startup path.
- [x] (2026-03-16 14:05Z) Migrate server bootstrap from single-root state to project contexts and project-scoped APIs.
- [x] (2026-03-16 14:45Z) Migrate the SPA routes and screens to global dashboard/feed plus project-scoped board/task views.
- [x] (2026-03-16 15:15Z) Replace the observability stack with JSONL log search, then add tests, smoke coverage, and the `README.md` versus `DEVELOPMENT.md` doc split for the new runtime contract.
- [x] (2026-03-16 15:35Z) Validate the Bun-backed toolchain and CLI workflow with `bun install`, `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`, `bun run start`, `bun run open`, `bun run logs`, `bun run dev`, and `openspec validate per-project-runtime-and-registry`.

## Surprises & Discoveries

- Observation: the current repository already has a `projects` table, but it lives inside the single application database and is seeded with only one bootstrap project.
  Evidence: `packages/db/src/index.ts` inserts `project-deliverator` when the `projects` table is empty and seeds tasks against that single project id.

- Observation: the current startup path still assumes one repo-root `.deliverator/` directory for workflow and runtime state.
  Evidence: `apps/server/src/main.ts` calls `initializeProductConfig(rootDir)` and `loadAndCompileWorkflow(rootDir)`, while `packages/core/src/init.ts` and `packages/core/src/workflow.ts` both target `<repoRoot>/.deliverator/...`.

- Observation: the current local runtime is strongly centered on Docker and a multi-container observability stack.
  Evidence: `Makefile` routes `dev` and `dev-start` through `scripts/setup.sh`, while `README.md`, `scripts/obs/up.sh`, and the `observability/` directory all assume Grafana, Tempo, Prometheus, Loki, Promtail, and the OpenTelemetry Collector are part of the default developer flow.

- Observation: the current workspace and root docs are still centered on `pnpm`, `make dev`, and a development-oriented `README.md`.
  Evidence: `package.json` declares `"packageManager": "pnpm@10.10.0"`, `README.md` leads with Docker-first development instructions, and `AGENTS.md` / `CLAUDE.md` still list `pnpm` and `make dev` as the primary commands.

- Observation: the worktree already contains substantial in-flight implementation for the registry/CLI/no-Docker direction, but it is still aligned to the pre-Bun tooling assumptions.
  Evidence: the current worktree includes changes under `apps/cli/*`, `apps/server/src/*`, `apps/server/web/*`, `packages/shared/*`, `packages/core/*`, and `packages/db/*`, while root tooling and docs still target `pnpm`.

- Observation: direct application runtime through Bun is still blocked by current library/runtime compatibility.
  Evidence: `bun run start` initially failed on `better-sqlite3` support, and after a Bun-specific SQLite shim it still hit runtime incompatibilities in the current Fastify/logging stack. The supported contract for this phase therefore becomes Bun as package manager and command runner, with a compatible Node-based execution path beneath `bun run ...`.

- Observation: the existing server already writes structured logs to both stdout and a log file, so JSONL logging can survive the simplification.
  Evidence: `apps/server/src/logger.ts` uses `pino` with a multistream that writes to `process.stdout` and `deliverator-server.log`.

- Observation: the current UI already conceptually distinguishes board, dashboard, feed, and projects, but only board and settings are implemented and the API is still single-project.
  Evidence: `docs/APP_STRUCTURE.md` defines global dashboard/feed/projects surfaces, while `apps/server/web/app.tsx` currently routes only `/dashboard`, `/board`, and `/settings`.

- Observation: there are active uncommitted UI and API changes in the worktree that are unrelated to this architecture plan.
  Evidence: `git status --short --branch` showed modifications under `apps/server/web/*`, `apps/server/src/routes/api.ts`, and `.claude/settings.local.json`.

## Decision Log

- Decision: treat this as a Tier 2 architectural change with a full ExecPlan and OpenSpec change before any code edits.
  Rationale: the change alters filesystem contracts, runtime initialization, routing, API semantics, and persistence boundaries across multiple packages.
  Date/Author: 2026-03-16 / Codex

- Decision: each managed project owns its own source of truth under `<project>/.deliverator/shared` and `<project>/.deliverator/local`.
  Rationale: project workflow, task state, and runtime evidence should travel with the project rather than being centralized in one global application database.
  Date/Author: 2026-03-16 / Codex

- Decision: global dashboard and feed will use runtime fan-out across all registered project databases instead of a mirrored central read model.
  Rationale: this keeps the first implementation simpler and avoids introducing synchronization logic before the project registry/runtime model is stable.
  Date/Author: 2026-03-16 / Codex

- Decision: the global registry database and all other application-global state live under `~/.deliverator`, not under the DELIVERATOR repo working tree.
  Rationale: global state should follow the operator account and application instance, while project state should travel with each managed project.
  Date/Author: 2026-03-16 / Codex

- Decision: remove Docker and the LGTM-style observability stack from the default architecture.
  Rationale: the current stack is too heavy for a portable local-first application and adds operational complexity that is not necessary for the current product stage.
  Date/Author: 2026-03-16 / Codex

- Decision: the primary local entrypoint becomes `deliverator start`, not `make dev`.
  Rationale: a single CLI command makes the product more portable and better aligned with the intended user experience than a development-only Docker wrapper.
  Date/Author: 2026-03-16 / Codex

- Decision: `deliverator start` runs in the foreground and stores runtime metadata in `~/.deliverator/run/current.json`.
  Rationale: foreground execution avoids introducing daemon supervision and process-control complexity while still allowing `deliverator open` to find the current URL from another shell.
  Date/Author: 2026-03-16 / Codex

- Decision: local observability is reduced to structured JSONL logs plus CLI log search.
  Rationale: JSONL provides enough diagnostic value for the current phase and is much easier to keep portable than traces, metrics backends, and multiple Docker services.
  Date/Author: 2026-03-16 / Codex

- Decision: Bun replaces `pnpm` as the package manager and primary command runner.
  Rationale: Bun improves local workflow ergonomics and gives the repo a single fast entrypoint for install and script execution without forcing a risky full runtime migration where current dependencies are not yet Bun-stable.
  Date/Author: 2026-03-16 / Codex

- Decision: contributor watch mode is exposed as `bun run dev`, while product-facing runtime remains `deliverator start`.
  Rationale: end users should see a simple product CLI, while contributors need a fast Bun-backed watch loop that is clearly separated from the product contract.
  Date/Author: 2026-03-16 / Codex

- Decision: `README.md` becomes product-facing, and contributor setup plus local workflow move into `DEVELOPMENT.md`.
  Rationale: the public repository should explain the product and its advantages first, while Bun setup, watch-mode development, and validation commands belong in a dedicated development document.
  Date/Author: 2026-03-16 / Codex

- Decision: the migration is a breaking cutover, not a long-lived dual-mode runtime.
  Rationale: keeping both the current single-project root model and the new per-project model would add branching and test burden to nearly every runtime path.
  Date/Author: 2026-03-16 / Codex

- Decision: DELIVERATOR should update a target project’s `.gitignore` to ignore `.deliverator/local/` while leaving `.deliverator/shared/` versionable.
  Rationale: the local/shared split is part of the product contract; leaving ignore management entirely manual would make the intended behavior too easy to violate.
  Date/Author: 2026-03-16 / Codex

## Outcomes & Retrospective

Current stopping point: the change is implemented and validated against the revised Bun-first contract. DELIVERATOR now treats `~/.deliverator` as the only global app-state home, stores workflow/runtime state with each managed project under `<project>/.deliverator/shared` and `<project>/.deliverator/local`, starts locally through `deliverator start`, exposes the active URL through `deliverator open`, searches JSONL logs through `deliverator logs`, and provides a Bun-backed watch loop through `bun run dev`. The remaining closeout step after this plan update is OpenSpec archival once the user is satisfied with the implementation.

## Context and Orientation

Today DELIVERATOR still behaves as though the application repository itself is the only project. `apps/server/src/main.ts` resolves the repo root, initializes one `.deliverator/` directory under that root, opens one SQLite database using `loadAppConfig(rootDir)`, and compiles one workflow from `.deliverator/workflow.yaml`. `packages/db/src/index.ts` seeds a single `projects` row and seeds all example tasks into that one database.

In the current model, “runtime paths” mean directories like `.deliverator/data`, `.deliverator/worktrees`, and `.deliverator/logs` resolved from the app repo root in development, and local startup is wrapped in Docker plus a telemetry stack. In the new model, those concepts split in two. Global application state moves to `~/.deliverator`, which becomes the only home for the registry database, runtime metadata, app-level preferences, and any future global caches or global logs. Project-local state moves under each registered project’s `<project>/.deliverator/local`. Shared project behavior such as workflow definitions and reusable prompts lives under `<project>/.deliverator/shared`.

The key files involved are:

- `apps/server/src/main.ts` and `apps/server/src/config.ts` for startup, config loading, and runtime root resolution.
- `apps/server/src/logger.ts` for structured JSONL logging.
- `apps/server/src/routes/api.ts` for project-scoped board/task/config routes plus global dashboard, feed, projects, and SSE routes.
- `packages/shared/src/index.ts` for path helpers and worktree identity logic.
- `packages/core/src/init.ts`, `packages/core/src/workflow.ts`, and `packages/core/src/index.ts` for default product files and workflow compilation.
- `packages/db/src/index.ts` and `packages/db/migrations/*.sql` for database structure, queries, and seed logic.
- `apps/server/web/*` for routing, project switching, dashboard, board, feed, and task detail UI state.
- `apps/cli/src/main.ts` for the product-facing CLI runtime.
- deleted Docker and observability assets that represented the retired runtime path.

The new CLI surface should live in a dedicated executable package, `apps/cli`, so executables remain separate from reusable libraries. `apps/cli` should own the `deliverator` binary and its subcommands. It should call the existing server/runtime modules directly in-process for `deliverator start` rather than launching Docker or shelling out to a second long-lived supervisor. Bun should be the package manager and primary command runner for this package and for the workspace as a whole.

The current route model is also single-project in practice. The SPA routes use `/dashboard` and `/board`, and the API exposes `/api/board` and `/api/tasks/:taskId`. That will change to canonical project-scoped board and task routes while keeping dashboard and feed global.

## Plan of Work

The first milestone is registry and filesystem foundations. Add explicit path helpers that distinguish global application paths from project-local paths. The global helpers should resolve into `~/.deliverator`, with a stable registry database path under `~/.deliverator/data/registry.db`, runtime metadata under `~/.deliverator/run/current.json`, and global logs under `~/.deliverator/logs`. Introduce a project registration flow that records `slug`, `name`, and `rootPath` in that registry database, creates `<project>/.deliverator/shared` and `<project>/.deliverator/local`, writes the default shared product files into `shared/`, and updates `.gitignore` so `.deliverator/local/` is ignored when the target project is a git repository. The app registry must not hold tasks, runs, or events.

The second milestone is the CLI runtime. Add `apps/cli` with a `deliverator` binary and implement `deliverator start`, `deliverator open`, and `deliverator logs`. `deliverator start` should start the Fastify server in-process, default to port `0` so the operating system chooses a free port, write the actual bound URL plus PID and timestamp into `~/.deliverator/run/current.json`, print the URL to stdout, and stay in the foreground. `deliverator open` should read the runtime metadata, print the current URL, verify the server is reachable, and open the browser. `deliverator logs` should search JSONL logs with basic filters such as `--project`, `--task`, `--run`, `--grep`, and `--follow`. In parallel, add a contributor-only Bun watch loop, exposed as `bun run dev`, that reruns the local runtime on source changes without reintroducing Docker.

The third milestone is project runtime bootstrapping. Replace the current one-root startup assumptions with a `ProjectRegistry` plus `ProjectContextManager`. A project context is the in-memory object that knows how to open one project’s database, apply migrations to `<project>/.deliverator/local/deliverator.db`, compile `<project>/.deliverator/shared/workflow.yaml`, and expose the project’s board/task data. The server bootstrap should load the global registry from `~/.deliverator` first, optionally seed one sample registered project in development, and then resolve project contexts lazily or on demand.

The fourth milestone is HTTP contract migration. Replace global board/task endpoints with project-scoped endpoints under `/api/projects/:projectSlug/...`. Keep `/api/dashboard`, `/api/feed`, and `/api/events/stream` as global endpoints. The SSE stream must include `projectSlug` in every event payload. The compiled-config endpoint becomes project-scoped because the compiled workflow is now per-project. The API layer should stop assuming globally unique task ids; the canonical identity becomes `(projectSlug, taskId)`. Remove metrics- and telemetry-stack-specific assumptions from the API and runtime where they are no longer needed.

The fifth milestone is SPA routing and interaction updates. The app shell should redirect `/` to the last selected project board when one exists or to `/projects` when the registry is empty. The board route becomes `/projects/:projectSlug/board`, and task detail becomes `/projects/:projectSlug/tasks/:taskId`. Dashboard and feed stay global. The Projects screen becomes a real registry screen with add-project behavior, and the app shell gains a project switcher that appears on project-scoped surfaces. Query keys and SSE invalidation logic must include `projectSlug`.

The sixth milestone is runtime simplification, validation, and documentation. Remove Docker-specific startup scripts, compose files, and observability assets from the supported runtime path. Replace the observability story with structured JSONL logs and CLI-based log search. Migrate workspace tooling and scripts from `pnpm` to Bun, update tests so two sample projects can coexist without data leakage, add CLI and project-registration smoke coverage, and split documentation so `README.md` is product-facing while `DEVELOPMENT.md` carries contributor setup, Bun commands, watch mode, and validation instructions. Update `ARCHITECTURE.md`, `docs/index.md`, `docs/APP_STRUCTURE.md`, `docs/CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, and `openspec/project.md` to explain the new filesystem, runtime, and Bun-first workflow contract.

## Concrete Steps

All commands below are run from `/Users/rnikitin/dev/deliverator` unless another directory is stated explicitly.

1. Create the planning artifacts for this architecture change:

       apply_patch ... docs/plans/2026-03-16-per-project-runtime-and-registry.md
       apply_patch ... openspec/changes/per-project-runtime-and-registry/proposal.md
       apply_patch ... openspec/changes/per-project-runtime-and-registry/design.md
       apply_patch ... openspec/changes/per-project-runtime-and-registry/tasks.md
       apply_patch ... openspec/changes/per-project-runtime-and-registry/specs/project-registry-runtime/spec.md

2. After user approval, add the app-registry and project-path foundations:

       apply_patch ... packages/shared/src/index.ts
       apply_patch ... packages/contracts/src/index.ts
       apply_patch ... packages/db/src/index.ts
       apply_patch ... packages/db/migrations/003_*.sql
       apply_patch ... packages/core/src/init.ts packages/core/src/workflow.ts packages/core/src/index.ts

3. After user approval, add the CLI runtime and Bun-backed contributor tooling:

       apply_patch ... apps/cli/package.json apps/cli/tsconfig.json apps/cli/src/*.ts
       apply_patch ... package.json bun.lock turbo.json
       bun run test

4. After user approval, migrate server bootstrap and API routes:

       apply_patch ... apps/server/src/config.ts
       apply_patch ... apps/server/src/main.ts
       apply_patch ... apps/server/src/routes/api.ts apps/server/src/logger.ts apps/server/src/telemetry.ts
       bun run test

5. After user approval, migrate the SPA:

       apply_patch ... apps/server/web/app.tsx
       apply_patch ... apps/server/web/components/*
       apply_patch ... apps/server/web/hooks/*

6. After user approval, retire Docker, migrate docs, and validate behavior:

       apply_patch ... package.json README.md DEVELOPMENT.md CONTRIBUTING.md ARCHITECTURE.md docs/CHANGELOG.md AGENTS.md CLAUDE.md openspec/project.md
       apply_patch ... .github/workflows/*
       git rm Makefile docker-compose.dev.yml docker-compose.obs.yml
       git rm -r observability
       git rm -r scripts/obs
       git rm scripts/setup.sh scripts/local/down.sh scripts/local/up.sh scripts/local/dev-logs.sh scripts/local/smoke-services.sh

7. After user approval, validate behavior:

       bun install
       bun run typecheck
       bun run lint
       bun run test
       bun run build
       bun run dev
       bun run apps/cli/src/main.ts start
       bun run apps/cli/src/main.ts open
       bun run apps/cli/src/main.ts logs --grep request_started
       openspec validate per-project-runtime-and-registry
       openspec list

## Validation and Acceptance

This plan is ready for implementation only after the user reviews the ExecPlan and explicitly approves moving forward.

Implementation is successful when DELIVERATOR can register at least two projects at different filesystem paths, creates the expected `.deliverator/shared` and `.deliverator/local` trees in each project, stores its global registry and app-level state under `~/.deliverator`, and keeps task/run/event data isolated per project while still showing a global dashboard and feed. The board and task detail must be project-scoped by route and API contract. The dashboard and feed must aggregate across projects without needing a mirrored central task store. `POST /api/projects` must succeed for a git repository and for a plain directory. If the target project is a git repository, `.gitignore` must contain an ignore rule for `.deliverator/local/` and must leave `.deliverator/shared/` commitable.

The runtime proof is successful only when the product can be started without Docker:
- `deliverator start` creates `~/.deliverator`, starts the web server on a random free port, writes `~/.deliverator/run/current.json`, prints the actual URL, and stays running
- `deliverator open` prints the same URL and opens it in the browser
- `deliverator logs` can search JSONL logs without requiring Grafana, Loki, or any other containerized backend
- contributors can run `bun run dev` and get a watch-mode local loop without Docker

The concrete behavior proof should include:

- `~/.deliverator/run/current.json` existing with the active URL and PID.
- `GET /api/projects` returning registered projects with stable slugs and root paths.
- `~/.deliverator/data/registry.db` existing and containing registry/app-state data only.
- `GET /api/projects/<slug>/board` returning only tasks from that project’s database.
- `GET /api/dashboard` returning counts aggregated across multiple project databases.
- `GET /api/feed` returning cross-project events ordered by time.
- `GET /api/events/stream` emitting payloads that include `projectSlug`.
- `/` redirecting to `/projects` when the registry is empty and to `/projects/<slug>/board` once a last-selected project exists.

## Idempotence and Recovery

Project registration must be safe to retry. Re-registering an existing project path should return the existing registry entry rather than creating a duplicate. Shared defaults must be written only when missing, not overwritten. Project-local migrations must remain idempotent through the existing `schema_migrations` table. If `.gitignore` update fails because the target project is not a git repo or is otherwise not writable, registration should still succeed and surface a non-fatal warning.

`deliverator start` should be safe to rerun after a prior foreground process exits. On startup it should overwrite `~/.deliverator/run/current.json` with the new runtime metadata. `deliverator open` should fail clearly if `current.json` is missing or points to an unreachable server. `deliverator logs` should tolerate malformed JSONL lines by skipping them with a warning rather than aborting the whole search.

This is a breaking cutover, so recovery means reverting the implementation branch rather than trying to keep both runtime models active. During implementation, keep changes staged behind the new registry/project-context abstractions first so the migration can be reasoned about in layers rather than as a single giant replacement.

## Artifacts and Notes

Important evidence gathered before implementation:

    $ git status --short --branch
    ## main...origin/main
     M .claude/settings.local.json
     M apps/server/src/routes/api.ts
     M apps/server/web/components/board-card.tsx
     M apps/server/web/components/board.tsx
     M apps/server/web/components/placeholder.tsx
     D apps/server/web/components/task-detail.tsx
     D apps/server/web/components/task-overview.tsx
     M apps/server/web/components/task-sidebar.tsx
    ?? apps/server/web/lib/board-styles.ts

    $ openspec list
    No active changes found.

    $ rg -n "initializeProductConfig|loadAndCompileWorkflow|getAllTasksForBoard|/api/board|projects table" apps packages
    apps/server/src/main.ts:18:  initializeProductConfig(rootDir);
    apps/server/src/main.ts:24:    seedDevelopmentState(dbContext, rootDir);
    apps/server/src/routes/api.ts:37:  app.get("/api/board", async () => {
    packages/db/src/index.ts:73:  const existingProject = context.db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number };
    packages/core/src/workflow.ts:34:  const workflowPath = path.join(workflowDir, "workflow.yaml");

    $ sed -n '1,200p' Makefile
    dev:
    	./scripts/setup.sh --watch
    dev-start:
    	./scripts/setup.sh

    $ sed -n '1,120p' package.json
    "packageManager": "pnpm@10.10.0"

    $ sed -n '1,200p' apps/server/src/logger.ts
    const destination = pino.destination({
      dest: logFilePath,
      mkdir: true,
      sync: false
    });

These transcripts establish the current single-project assumptions and the presence of unrelated dirty worktree changes that should not be overwritten while preparing the architecture change.

## Interfaces and Dependencies

The implementation should end with these stable interface concepts:

- `RegisteredProject` in `packages/contracts/src/index.ts`, containing at least `id`, `slug`, `name`, and `rootPath`.
- `ProjectPaths` in `packages/shared/src/index.ts`, containing the resolved paths for a project’s `.deliverator/shared` and `.deliverator/local` trees plus subdirectories for database, logs, worktrees, and artifacts.
- `GlobalAppPaths` in `packages/shared/src/index.ts`, containing the resolved global paths under `~/.deliverator`, including `dataDir`, `logsDir`, and `registryDbPath`.
- `ProjectContext` in server- or db-adjacent code, containing the registry entry, compiled workflow, database context, and resolved paths for one project.
- `RuntimeState` in the CLI layer, containing at least `pid`, `port`, `url`, and `startedAt`, serialized into `~/.deliverator/run/current.json`.
- `deliverator start`, `deliverator open`, and `deliverator logs` in `apps/cli`.
- Project-scoped API handlers under `/api/projects/:projectSlug/...`.
- Global aggregate handlers for `/api/dashboard`, `/api/feed`, and `/api/events/stream`.

Use the existing libraries already in the repo: Fastify for HTTP, React Router for the SPA, TypeBox + Ajv for contracts, and `better-sqlite3` for both the global registry database under `~/.deliverator` and each project-local database. Add a small cross-platform browser opener such as the `open` package for `deliverator open`. Keep logging on `pino` and JSONL files. Do not add a central mirror service, background sync dependency, Docker requirement, or observability backend in this phase.

Revision note: this revision widens the plan from “per-project registry only” to “per-project registry plus a Bun-backed CLI-first no-Docker workflow.” It removes Docker and the local observability stack from the intended target architecture, adds `deliverator start`, `deliverator open`, and JSONL log search as first-class requirements, and splits product-facing documentation from contributor development guidance.
