## 1. Planning Artifacts

- [x] 1.1 Create the ExecPlan at `docs/plans/2026-03-16-per-project-runtime-and-registry.md`.
- [x] 1.2 Create `proposal.md`, `design.md`, `tasks.md`, and the `project-registry-runtime` spec delta.
- [x] 1.3 Validate the drafted change with `openspec list` and `openspec validate per-project-runtime-and-registry`.
- [x] 1.4 Pause for user review and approval before continuing implementation.

## 2. Registry and Filesystem Foundations

- [x] 2.1 Add global registry storage under `~/.deliverator` and project-path helpers that distinguish global app paths from project-local `.deliverator/shared` and `.deliverator/local`.
- [x] 2.2 Add registry contracts and migrations for `registered_projects` and `app_state`.
- [x] 2.3 Move shared product-default generation from repo-root `.deliverator/` into project-root `.deliverator/shared/`.
- [x] 2.4 Add target-project `.gitignore` management for `.deliverator/local/` and tests for git/non-git cases.

## 3. CLI Runtime and Logging

- [x] 3.1 Add `apps/cli` and the `deliverator` binary.
- [x] 3.2 Implement `deliverator start` with random-port startup and `~/.deliverator/run/current.json`.
- [x] 3.3 Implement `deliverator open` using the stored runtime metadata.
- [x] 3.4 Implement `deliverator logs` with JSONL search and follow mode.
- [x] 3.5 Replace `pnpm` workspace tooling with Bun and add a Bun-backed `bun run dev` watch loop.

## 4. Project Runtime and API Migration

- [x] 4.1 Replace single-root workflow/database boot with a project registry plus project context manager.
- [x] 4.2 Add project-scoped API routes for compiled config, board, board schema, and task detail.
- [x] 4.3 Add global APIs for projects, dashboard, feed, and project-aware SSE payloads.
- [x] 4.4 Remove the old single-project board/task route assumptions after the new API contract passes.

## 5. SPA Migration

- [x] 5.1 Update the router so `/` redirects to `/projects` or the last selected project board.
- [x] 5.2 Implement the Projects screen as a real registry management surface.
- [x] 5.3 Make board and task detail routes project-scoped and add a project switcher in the app shell.
- [x] 5.4 Keep dashboard and feed global while updating query keys and SSE invalidation to use `projectSlug`.

## 6. Runtime Simplification, Validation, and Docs

- [x] 6.1 Remove Docker-first startup paths, compose files, observability assets, and Docker-based validation from the supported runtime.
- [x] 6.2 Add or update unit and integration tests for registration, path resolution, CLI runtime state, JSONL log search, multi-project isolation, global aggregation, and project-scoped routing.
- [x] 6.3 Replace Docker smoke coverage with CLI-first smoke coverage around `deliverator start`, `deliverator open`, `deliverator logs`, and the Bun-backed dev watch path.
- [x] 6.4 Run `bun install`, `bun run typecheck`, `bun run lint`, `bun run test`, CLI smoke checks, `openspec validate per-project-runtime-and-registry`, and `openspec list`.
- [x] 6.5 Rewrite `README.md` as a product-facing document and move contributor setup plus watch-mode guidance into `DEVELOPMENT.md`.
- [x] 6.6 Update `CONTRIBUTING.md`, `ARCHITECTURE.md`, `docs/index.md`, `docs/APP_STRUCTURE.md`, `docs/CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, and `openspec/project.md`.
