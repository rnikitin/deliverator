# Change: Introduce per-project runtime state, a global registry, and a Bun-backed CLI-first workflow

## Why

DELIVERATOR currently behaves like a single-project application rooted at the DELIVERATOR repository itself. Workflow files, runtime state, and the SQLite database all live under one repo-root `.deliverator/`, and the board/task APIs assume a single global task space. The local runtime is also tied to Docker and a heavy observability stack. That model is too limiting for the intended product: DELIVERATOR should manage many projects, each with its own workflow, task state, database, worktrees, and artifacts, and should start locally through a portable CLI rather than through Docker orchestration.

We need to invert the ownership model and simplify the runtime. DELIVERATOR should become a global operator surface over registered projects. Each project should own its own `.deliverator/shared` and `.deliverator/local` trees, while the app itself stores only global registry metadata and app-level preferences under `~/.deliverator`. The product should start with `deliverator start`, expose the current URL through `deliverator open`, rely on searchable JSONL logs instead of a Dockerized telemetry backend, and use Bun as the package manager and primary command runner. Contributor watch mode should move to a Bun-driven flow instead of `make dev`.

## What Changes

- Add a global registry under `~/.deliverator` that stores registered project identity and root paths, plus app-level state such as the last selected project.
- Move project workflow and portable config into `<project>/.deliverator/shared`.
- Move project-local database, logs, worktrees, and artifacts into `<project>/.deliverator/local`.
- Auto-manage target-project `.gitignore` so `.deliverator/local/` is ignored while `.deliverator/shared/` stays versionable.
- Add a CLI runtime entrypoint with `deliverator start`, `deliverator open`, and `deliverator logs`.
- Replace `pnpm` with Bun as the workspace package manager and primary command runner.
- Add a Bun-backed watch-mode contributor entrypoint such as `bun run dev`.
- Remove Docker as the supported default local runtime path.
- Remove the local Grafana/Tempo/Prometheus/Loki/Promtail/OpenTelemetry stack from the target architecture.
- Replace the local observability story with structured JSONL logs and local log search.
- Replace single-project startup with project context management and per-project workflow compilation.
- Replace single-project board/task routes and APIs with project-scoped routes and APIs.
- Add global dashboard and feed APIs that aggregate across registered project databases through runtime fan-out.
- Tag global SSE payloads with `projectSlug`.
- Update the SPA so dashboard/feed remain global while board/task detail become project-scoped.
- Update docs and local contracts to explain the new global-under-`~/.deliverator` vs project-local storage model.
- Rewrite `README.md` to be product-facing and move developer setup/runtime guidance into `DEVELOPMENT.md`, while keeping `CONTRIBUTING.md` focused on contribution process.

## Non-Goals

- Add a central mirrored event/task read model.
- Keep the old single-project repo-root runtime mode as a supported parallel path.
- Introduce background sync daemons or worker processes just to aggregate dashboard/feed data.
- Add daemon-style process supervision or a detached background server manager in this phase.
- Redesign the visual system or expand the product surface beyond the routing and data changes required by this new architecture.
- Implement `deliverator add <path>` yet. Project registration can remain web/API-driven in this change.

## Impact

- Affected specs:
  - `project-registry-runtime`
- Affected docs:
  - `README.md`
  - `DEVELOPMENT.md`
  - `CONTRIBUTING.md`
  - `ARCHITECTURE.md`
  - `docs/index.md`
  - `docs/APP_STRUCTURE.md`
  - `docs/CHANGELOG.md`
  - `AGENTS.md`
  - `openspec/project.md`
- Affected code:
  - `apps/server/src/*`
  - `apps/cli/*`
  - `apps/server/web/*`
  - `packages/shared/*`
  - `packages/core/*`
  - `packages/contracts/*`
  - `packages/db/*`
  - root `package.json`
  - `bun.lock`
  - `.github/workflows/*`
  - `scripts/*`
  - `observability/*`

## Build Order and Risk

This is a large architectural cutover and therefore requires a review checkpoint before implementation. The work should be staged so the registry and project-path foundations land before server/API migration, and the API migration lands before the SPA migration.

Primary risks:
- mixing global `~/.deliverator` state and per-project `.deliverator` state and accidentally overwriting one with the other
- breaking existing board and task behavior while changing route semantics
- making the CLI runtime too coupled to the current server bootstrap
- making the Bun migration and watch loop drift from the product-facing CLI contract
- regressing portability with platform-specific browser opening or log-search assumptions
- colliding with unrelated dirty worktree changes already present in `apps/server/web/*`

Mitigations:
- keep registry storage separate from project storage from the first migration onward
- add the CLI entrypoint as its own app package with a small stable runtime-state file
- keep product runtime commands (`deliverator start/open/logs`) separate from contributor-only commands (`bun run dev`)
- make the API contract project-scoped before updating the UI query keys
- keep global aggregation to request-time fan-out only in this phase
- keep JSONL log search simple and local-first
- do not overwrite unrelated in-progress UI changes while preparing the change
