# Contracts Reconciliation and Phase A: AppShell + Board + Task Detail

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `docs/PLANS.md` (repo-root planning standard). It is Tier 2 work: new user-facing capabilities, API changes, cross-package changes, and public-surface changes.


## Purpose / Big Picture

After this change, a developer running `make dev` can open the DELIVERATOR UI in a browser and see a real application instead of placeholder pages. They will see a top navigation bar with the DELIVERATOR wordmark and primary nav tabs, a kanban board with stage columns (defined by the workflow config) showing task cards colored by attention state, and a task detail page with an overview tab reached by clicking any card.

Stages are NOT hardcoded in contracts. `StageSchema` is `Type.String()` — it accepts any string. The concrete stages (inbox, discovery, research, build_test, feedback, deploy, done) are defined in `.deliverator/workflow.yaml` and validated at runtime against the compiled workflow config. This means stage vocabulary is a deployment-time concern, not a compile-time one.

Attention states ARE hardcoded in contracts. `AttentionStateSchema` remains a fixed union of 7 literals: `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`. These are system-level concepts that the control plane relies on for deterministic behavior (e.g., "blocked tasks get a red tint", "paused tasks need human action") and should not vary per deployment.

The workflow config file `.deliverator/workflow.yaml` defines stages, their labels, allowed transitions, and stage order. This file is gitignored — it is local runtime state, not committed config. A default version is created if one does not exist. At server startup, the workflow YAML is compiled into an in-memory config object and served via `/api/config/compiled`. There is no persistent compiled artifact on disk; the config is recompiled every time the server starts.

How to see it working: start the dev server, open the browser, see the kanban board at `/` with tasks in their correct stage columns (read from the compiled config), click a task card to navigate to `/tasks/:taskId` and see the task detail overview, click "Back to Board" to return. The top bar persists across all navigations.


## Progress

- [ ] Milestone 0: Contracts reconciliation and workflow config
- [ ] Milestone 1: Design system foundation (Tailwind, shadcn/ui, fonts, tokens)
- [ ] Milestone 2: AppShell and routing
- [ ] Milestone 3: Board screen
- [ ] Milestone 4: Task Detail with Overview tab
- [ ] Milestone 5: Board API and SSE wiring
- [ ] Final validation and cleanup


## Surprises & Discoveries

(None yet — will be populated during implementation.)


## Decision Log

- Decision: Combine contracts reconciliation with Phase A into a single ExecPlan.
  Rationale: The contracts change is a hard prerequisite for Phase A — no screen can render without the correct stage/attention vocabulary. Keeping them together ensures the entire vertical slice is self-contained. The contracts change is small (one file plus downstream type updates) and does not warrant a standalone plan.
  Date/Author: 2026-03-14 / ExecPlan author

- Decision: Stages are runtime-validated strings, not hardcoded contract literals. Attention states remain a hardcoded 7-value union.
  Rationale: Stages are a workflow-configuration concern — the concrete list (inbox, discovery, research, etc.) comes from `.deliverator/workflow.yaml` and may vary per deployment or project. Hardcoding them in contracts would couple the type system to a specific workflow shape. Attention states, by contrast, are system-level concepts that the control plane, UI visual treatment, and policy gates all depend on deterministically (e.g., "blocked" always means red tint, "paused_for_human" always means operator action needed). They belong in contracts as a fixed union.
  Date/Author: 2026-03-15 / ExecPlan author

- Decision: Workflow YAML compiled at server startup, held in memory only. No persistent compiled artifact on disk.
  Rationale: The workflow config is small and fast to compile. Recompiling on every startup avoids stale-cache bugs and keeps the runtime state directory clean. The compiled result is served via `/api/config/compiled` for the UI and any external consumers. If the YAML file is missing, the server writes a default one — so the system is self-bootstrapping.
  Date/Author: 2026-03-15 / ExecPlan author

- Decision: No separate `/api/board/schema` endpoint. Stage and move data served from `/api/config/compiled`.
  Rationale: The compiled config already contains the stage list, allowed moves, and attention states. Adding a duplicate endpoint for the same data creates a maintenance burden and a potential consistency gap. The UI fetches the compiled config once and uses it for both board column rendering and move validation.
  Date/Author: 2026-03-15 / ExecPlan author


## Outcomes & Retrospective

(To be completed after implementation.)


## Context and Orientation

DELIVERATOR is a workflow orchestration system for AI CLI agents. The repository is a pnpm monorepo with Turbo. The single application server lives in `apps/server/` and is built with Fastify (Node.js HTTP framework, v5). The UI is a React single-page application (SPA) served by the same Fastify process through the `@fastify/vite` plugin. There is no separate frontend server.

### Current UI State

The UI is a proof-of-concept shell. Two React components exist:

- `apps/server/web/components/operator-shell.tsx` — the home page, fetches `/api/config/compiled` and displays informational cards about the system. It uses raw `fetch()` inside `useEffect`.
- `apps/server/web/components/task-shell.tsx` — a task detail page at `/tasks/:taskId`, fetches a task by ID and displays its fields. Also raw `fetch()`.

The router (`apps/server/web/app.tsx`) uses React Router v7 with two routes: `/` and `/tasks/:taskId`. A catch-all redirects to `/`.

The CSS (`apps/server/web/styles.css`) uses a custom stylesheet with IBM Plex Sans and Space Grotesk fonts and glassmorphism card effects. This will be replaced by the design system tokens from `docs/DESIGN_SYSTEM.md`.

There is no component library, no Tailwind CSS, no state management library, and no data fetching library beyond raw fetch.

### Current Contracts State

`packages/contracts/src/index.ts` defines TypeBox schemas for all domain types. `StageSchema` is already `Type.String()` — it accepts any string value. This is the correct design: stages are not hardcoded in contracts because the concrete stage list comes from the workflow config file.

`AttentionStateSchema` is currently `Type.String()` — a placeholder that does not constrain values. It needs to be changed to a fixed union of 7 literals representing the system-level attention states. Unlike stages, attention states are hardcoded because the control plane and UI both rely on a known, finite set of states for deterministic behavior (routing, visual treatment, policy gates).

The correct 7 attention states (from `docs/DESIGN_SYSTEM.md`): `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`.

The default 7 stages (from `docs/research/docs/04-workflow-model.md` and `docs/DESIGN_SYSTEM.md`): `inbox`, `discovery`, `research`, `build_test`, `feedback`, `deploy`, `done`. These will be defined in `.deliverator/workflow.yaml`, not in contracts.

### Workflow Config Model

`.deliverator/workflow.yaml` is the source of truth for stage definitions. It is gitignored (local runtime state). The file defines:
- The ordered list of stages with labels
- Allowed manual transitions between stages
- Automatic transitions (e.g., build_test -> feedback when validation passes)

At server startup, `packages/core` reads and compiles this YAML into an in-memory config object. The compiled result includes the stage list, allowed moves map, and stage metadata. This compiled config is served to the UI via `GET /api/config/compiled`. There is no persistent compiled artifact on disk — the config is recompiled fresh every time the server starts.

### Current Server API

`apps/server/src/routes/api.ts` defines: `/healthz`, `/readyz`, `/api/config/compiled`, `/api/events/stream` (SSE), `/api/metrics`, `/api/tasks/:taskId`. The board screen needs a new `/api/board` endpoint that returns all tasks grouped for the kanban view. The allowed moves and stage list come from the compiled config (served via `/api/config/compiled`), so there is no separate `/api/board/schema` endpoint — the UI reads stage and transition info from the compiled config response.

### Current Database Schema

`packages/db/` uses better-sqlite3 with WAL mode. The `tasks` table has columns for `stage` and `attention_state` that store the current placeholder values. The seed script in `apps/server/src/scripts/seed.ts` populates bootstrap tasks with placeholder stage/attention values. Both the schema CHECK constraints (if any) and the seed data must be updated.

### Key Files

    packages/contracts/src/index.ts          — TypeBox schemas, types, validation
    packages/core/src/index.ts               — Compiled config builder, workflow stages
    packages/db/src/index.ts                 — Database open, migrate, seed, queries
    packages/db/migrations/                  — SQL migration files
    apps/server/src/app.ts                   — Fastify app creation, Vite plugin
    apps/server/src/routes/api.ts            — API route handlers
    apps/server/web/app.tsx                  — React Router setup
    apps/server/web/main.tsx                 — React entry point
    apps/server/web/styles.css               — Current CSS (to be replaced)
    apps/server/web/index.html               — HTML shell
    apps/server/web/components/              — React components directory
    apps/server/vite.config.ts               — Vite configuration
    apps/server/package.json                 — Server app dependencies
    .deliverator/workflow.yaml               — Workflow config (gitignored, local runtime state)
    docs/DESIGN_SYSTEM.md                    — Design tokens, colors, typography
    docs/APP_STRUCTURE.md                    — Screen architecture and route map


## Plan of Work

### Milestone 0 — Contracts Reconciliation and Workflow Config

Update the contracts package and add the workflow config compilation pipeline. This milestone establishes the split: attention states are hardcoded in contracts (system-level invariants), while stages are runtime-validated against the compiled workflow config.

In `packages/contracts/src/index.ts`:
- `StageSchema` stays as `Type.String()` — no change needed. Stages are validated at runtime against the compiled workflow config, not at the type level.
- Replace `AttentionStateSchema` from the current `Type.String()` placeholder with a fixed union of 7 literals: `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`. These are system-level concepts that the control plane depends on.
- Update `CompiledConfigSchema` to include workflow data: add an `allowedMoves` field (record of stage string to array of stage strings) and an `attentionStates` array alongside the existing `stages` array. This is the shape the UI will consume.
- Remove any `STAGES` or `ALLOWED_MOVES` constants if they exist — these come from the compiled workflow config, not from contracts.

In `.deliverator/workflow.yaml` (new file, gitignored):
- Create a default workflow config file defining the 7 stages with labels and their allowed manual transitions.
- Format: a YAML file with a `stages` list (each entry has `id`, `label`, `defaultAttentionState`) and an `allowedMoves` map (each key is a source stage, value is an array of target stages).
- This file is gitignored because `.deliverator/` is reserved for local runtime state. If the file does not exist at startup, the server creates it from a built-in default.

In `packages/core/`:
- Add a workflow YAML loader/compiler module (e.g., `packages/core/src/workflow-config.ts`) that:
  - Reads `.deliverator/workflow.yaml` from disk.
  - Parses and validates the YAML structure.
  - Produces an in-memory compiled workflow config object with the stage list, allowed moves map, and stage metadata.
  - Writes a default workflow.yaml if the file is missing.
- Update `buildCompiledConfig()` in `packages/core/src/index.ts` to accept the compiled workflow data and include it in the `CompiledConfig` response (stages, allowed moves, attention states).
- Remove the hardcoded `workflowStages` array — the stage list now comes from the YAML loader.
- The `getAttentionStateForStage()` helper should read from the compiled workflow config rather than a hardcoded array.

In `packages/db/`:
- Add a new migration (e.g., `002_reconcile_stages.sql`) that updates existing task rows to map old stages to new stages and old attention states to new attention states. The mapping: `triage` -> `inbox`, `ready` -> `discovery`, `in_progress` -> `build_test`, `review` -> `feedback`, `blocked` -> `inbox` (with attention `blocked`), `done` -> `done`. For attention: `normal` -> `actively_working`, `needs_human` -> `awaiting_human_input`, `waiting_on_dependency` -> `paused_for_human`, `failed` -> `blocked`.
- Update the seed script to use the new stage and attention state values.

In `apps/server/`:
- Update server startup to call the workflow config loader/compiler at boot time, before registering routes.
- Pass the compiled workflow data to `buildCompiledConfig()`.
- Update `api.ts` if any route handler references old stage or attention literals.

### Milestone 1 — Design System Foundation

Install and configure Tailwind CSS and shadcn/ui. Replace the current custom CSS with design system tokens from `docs/DESIGN_SYSTEM.md`.

Install dependencies in `apps/server/`:
- `tailwindcss`, `@tailwindcss/vite` (Tailwind v4 Vite plugin), `class-variance-authority`, `clsx`, `tailwind-merge` (shadcn dependencies), `lucide-react` (icon library used by shadcn).
- Initialize shadcn with `components.json` pointing to `web/components/ui/` as the output directory.

Create or update:
- `apps/server/web/app.css` — CSS custom properties from `docs/DESIGN_SYSTEM.md` (all foundation tokens, attention state tokens, stage tokens, light and dark mode).
- `tailwind.config.ts` — theme extensions for fonts (Chakra Petch, Outfit, JetBrains Mono), border-radius overrides (`0` everywhere), and color references to CSS variables.
- `apps/server/web/index.html` — add Google Fonts link tags for Chakra Petch, Outfit, JetBrains Mono.
- `apps/server/web/lib/utils.ts` — the standard `cn()` utility that combines `clsx` and `tailwind-merge`.

Remove `apps/server/web/styles.css` (the old custom stylesheet) once the new tokens are in place.

### Milestone 2 — AppShell and Routing

Create the persistent application shell and update the router to match the route map from `docs/APP_STRUCTURE.md`.

Create `apps/server/web/components/app-shell.tsx`:
- A layout component with the 48px sticky top bar.
- Left: "DELIVERATOR" wordmark (Chakra Petch, links to `/`).
- Center: primary nav tabs — Board, Dashboard, Feed, Projects. Active tab uses the `--primary` accent underline per the design system tab spec.
- Right: placeholder slots for command palette trigger, attention badge, settings gear, dark/light toggle.
- Below the top bar: `<Outlet />` from React Router for child route content.

Update `apps/server/web/app.tsx`:
- Wrap all routes in the `AppShell` layout route.
- Define routes matching `docs/APP_STRUCTURE.md`: `/` (Board), `/dashboard` (placeholder), `/feed` (placeholder), `/projects` (placeholder), `/system` (placeholder), `/tasks/:taskId` (Task Detail parent with nested tab routes), `/settings` (placeholder).
- Task detail nested routes: default index (overview), `/plan`, `/runs`, `/runs/:runId`, `/comments`. All render placeholder content initially except the overview tab which is built in Milestone 4.

Update `apps/server/src/app.ts`:
- Add Fastify catch-all SPA route entries for new client-side routes so that direct navigation and refresh work. Currently only `/` and `/tasks/:taskId` are registered; all routes in the route map need SPA fallback.

Install client-side dependencies in `apps/server/`:
- `@tanstack/react-query` — server state management.
- `zustand` — UI state management.

Create `apps/server/web/lib/query-client.ts`:
- Export a configured `QueryClient` instance with sensible defaults (stale time, retry policy).

Wrap the app in `QueryClientProvider` in `main.tsx` or `app.tsx`.

### Milestone 3 — Board Screen

Build the kanban board — the primary operating surface.

Create `apps/server/web/components/board.tsx`:
- Reads the stage list from the compiled config API response (`GET /api/config/compiled` -> `stages` array). Does NOT hardcode stage names.
- Renders one column per stage in a horizontal CSS Grid or flex layout.
- Each column has a header: stage name in Chakra Petch uppercase with 2px bottom border in the stage color, plus a task count badge.
- The last stage (typically `done`) is collapsed by default (shows count only, expandable).
- Columns have `min-width: 200px` and scroll horizontally if the viewport is narrow.

Create `apps/server/web/components/board-card.tsx`:
- A single task card rendered inside a column.
- 2px left border colored by attention state.
- Attention state badge (uppercase Chakra Petch label with state color background).
- Task title.
- Stage dot + label.
- Last activity timestamp (relative, e.g., "2m ago").
- PR indicator if a PR is linked.
- Visual treatments per `docs/DESIGN_SYSTEM.md`: blocked cards get faint red tint, actively_working cards get pulsing left border, ready_to_archive cards are dimmed.
- Click navigates to `/tasks/:taskId`.

Create `apps/server/web/hooks/use-board.ts`:
- TanStack Query hook that fetches `GET /api/board` and returns tasks grouped by stage.
- The board component also fetches `GET /api/config/compiled` to get the ordered stage list and allowed moves (so it knows which columns to render and in what order).

### Milestone 4 — Task Detail with Overview Tab

Build the task detail parent layout and overview tab.

Create `apps/server/web/components/task-detail.tsx`:
- Parent route component for `/tasks/:taskId`.
- Persistent header: back link to board, task title (Chakra Petch), stage dot + label, attention state badge, project name.
- Tab bar with links to nested routes: Overview, Plan & Artifacts, Runs, Comments. Active tab has `--primary` 2px bottom border.
- `<Outlet />` for tab content.
- Bottom action bar (placeholder for now): shows allowed move buttons as disabled placeholders.

Create `apps/server/web/components/task-overview.tsx`:
- Default tab content at `/tasks/:taskId` (index route).
- Summary section with task description.
- Key metrics: stage, attention state, created at, last updated.
- Latest artifacts section (placeholder — "No artifacts yet").
- Latest comments section (placeholder — "No comments yet").

Create `apps/server/web/hooks/use-task.ts`:
- TanStack Query hook that fetches `GET /api/tasks/:taskId` and returns the full task record.

### Milestone 5 — Board API and SSE Wiring

Create the server-side board endpoint and wire SSE to TanStack Query invalidation.

In `apps/server/src/routes/api.ts`:
- Add `GET /api/board` — queries all tasks from the database, groups them by stage, returns the board payload. Include for each task: id, title, stage, attentionState, summary, last event timestamp, project slug. The stage column list comes from the compiled workflow config (so the board always reflects the current workflow definition).
- No separate `/api/board/schema` endpoint is needed — the UI reads allowed moves, stage list, and attention state list from the existing `GET /api/config/compiled` response.

In `packages/db/src/index.ts` (or a new query module):
- Add `getAllTasks(context)` — returns all tasks joined with their latest event timestamp and project slug.
- Add `getTaskWithDetails(context, taskId)` — returns a single task with project, latest events, and workspace info.

Create `apps/server/web/hooks/use-global-sse.ts`:
- Connects to `GET /api/events/stream` (the existing SSE endpoint).
- On `task.moved` or `attention.changed` events, calls `queryClient.invalidateQueries({ queryKey: ["board"] })`.
- On `task.updated` events, calls `queryClient.invalidateQueries({ queryKey: ["task", taskId] })`.
- Mounted once in `AppShell`.

Update the existing SSE endpoint in `apps/server/src/routes/api.ts`:
- If needed, enhance the heartbeat-only SSE to also emit real events when tasks change. At minimum, ensure the `bootstrap` event includes enough data for the client to know it is connected.


## Concrete Steps

All commands assume the working directory is the repository root: `/Users/rnikitin/dev/deliverator`.

### Milestone 0

1. Edit `packages/contracts/src/index.ts`:
   - `StageSchema` stays as `Type.String()` — no change needed.
   - Replace `AttentionStateSchema` from `Type.String()` to a union of 7 literals: `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`.
   - Update `CompiledConfigSchema` to add `allowedMoves` (Record<string, string[]>) and `attentionStates` (array of {id, label} objects) fields.

2. Run the TypeScript compiler to find all downstream breakages:

        cd /Users/rnikitin/dev/deliverator && pnpm typecheck

   Expected: errors in `packages/core` and possibly `apps/server` where old attention-state literals (e.g., `"normal"`, `"needs_human"`) are used.

3. Create the default workflow config file at `.deliverator/workflow.yaml` with:
   - The 7 stages: inbox, discovery, research, build_test, feedback, deploy, done (each with a label and default attention state).
   - The allowed manual moves map (inbox->discovery, discovery->research, research->build_test, feedback->research, feedback->deploy).
   - The automatic moves (build_test->feedback, deploy->done).

4. Create `packages/core/src/workflow-config.ts`:
   - A `loadWorkflowConfig(configDir: string)` function that reads and parses `.deliverator/workflow.yaml`.
   - A `compileWorkflow(raw)` function that validates the parsed YAML and produces a typed in-memory workflow config (stage list, allowed moves, metadata).
   - A `writeDefaultWorkflowConfig(configDir: string)` function that creates the default YAML if the file is missing.
   - Install `yaml` (or `js-yaml`) as a dependency of `packages/core` if a YAML parser is not already available.

5. Update `packages/core/src/index.ts`:
   - Remove the hardcoded `workflowStages` array.
   - Update `buildCompiledConfig()` to accept a compiled workflow config parameter and include its stages, allowed moves, and attention states in the output.
   - Update or remove `getAttentionStateForStage()` and `getWorkflowStages()` — these should read from the compiled workflow object, not a hardcoded array.

6. Add migration `packages/db/migrations/002_reconcile_stages.sql` to update existing rows (mapping old stage/attention values to new ones).

7. Update seed script in `apps/server/src/scripts/seed.ts` with new stage and attention state values.

8. Update `apps/server/` startup:
   - Call the workflow config loader at boot (before routes register).
   - Pass the compiled workflow data to `buildCompiledConfig()`.
   - Fix any route handlers referencing old attention-state literals.

9. Fix all remaining type errors found in step 2.

10. Run:

        pnpm typecheck && pnpm test

    Expected: zero type errors, all existing tests pass (some tests may need attention-state literal updates).

### Milestone 1

1. Install Tailwind and shadcn dependencies:

        cd apps/server && pnpm add -D tailwindcss @tailwindcss/vite && pnpm add class-variance-authority clsx tailwind-merge lucide-react

2. Create `apps/server/web/app.css` with all CSS custom properties from `docs/DESIGN_SYSTEM.md`.

3. Create or update `tailwind.config.ts` with font families, radius overrides, and CSS variable references.

4. Update `apps/server/vite.config.ts` to include the Tailwind Vite plugin.

5. Update `apps/server/web/index.html` to add Google Fonts links.

6. Create `apps/server/web/lib/utils.ts` with the `cn()` utility.

7. Remove `apps/server/web/styles.css` and update imports.

8. Run:

        pnpm build

   Expected: build succeeds, no CSS errors.

### Milestone 2

1. Install data fetching and state management:

        cd apps/server && pnpm add @tanstack/react-query zustand

2. Create `apps/server/web/lib/query-client.ts`.

3. Create `apps/server/web/components/app-shell.tsx`.

4. Rewrite `apps/server/web/app.tsx` with the full route map and AppShell layout.

5. Update `apps/server/src/app.ts` to add SPA catch-all routes for all client-side paths.

6. Create placeholder components for screens not yet built (Dashboard, Feed, Projects, System, Settings) — each a simple component with the screen name as heading.

7. Run:

        pnpm build && pnpm typecheck

   Expected: build succeeds. Navigating to `/`, `/dashboard`, `/feed`, `/projects`, `/system`, `/settings` all render inside the AppShell with the correct nav tab highlighted.

### Milestone 3

1. Create `apps/server/web/components/board.tsx` and `apps/server/web/components/board-card.tsx`.

2. Create `apps/server/web/hooks/use-board.ts`.

3. Run:

        pnpm build && pnpm typecheck

   Expected: the board renders at `/` with 7 columns. If the API endpoint is not yet available, the board shows a loading state.

### Milestone 4

1. Create `apps/server/web/components/task-detail.tsx` and `apps/server/web/components/task-overview.tsx`.

2. Create `apps/server/web/hooks/use-task.ts`.

3. Update the router to nest the overview component as the index route under `/tasks/:taskId`.

4. Run:

        pnpm build && pnpm typecheck

   Expected: clicking a board card navigates to `/tasks/:taskId` showing the task detail layout with overview tab. "Back to Board" returns to `/`.

### Milestone 5

1. Add `GET /api/board` route handler in `apps/server/src/routes/api.ts`. (No separate `/api/board/schema` endpoint — the UI reads stage and move data from `GET /api/config/compiled`.)

2. Add database query functions in `packages/db/`.

3. Create `apps/server/web/hooks/use-global-sse.ts`.

4. Mount `useGlobalSSE()` in `AppShell`.

5. Update the existing `/api/tasks/:taskId` handler to return the enriched task payload (with project info).

6. Run the full validation:

        pnpm typecheck && pnpm test && pnpm build

   Expected: all pass.

7. Start the dev server and verify end-to-end:

        make dev

   Expected: board loads at `/` with seeded tasks in their columns, clicking a card opens task detail, back button returns to board, top nav tabs work, SSE connection is established (visible in browser Network tab as an open EventSource connection).


## Validation and Acceptance

### Contracts reconciliation and workflow config (Milestone 0)

Run `pnpm typecheck` from the repo root. Expected: zero errors. The `Stage` type resolves to `string` (validated at runtime against the compiled workflow config, not at the type level). The `AttentionState` type resolves to `"actively_working" | "awaiting_human_input" | "awaiting_human_approval" | "blocked" | "ready_for_feedback" | "ready_to_archive" | "paused_for_human"`. Run `pnpm test` — all existing tests pass (with updated literals where needed).

The file `.deliverator/workflow.yaml` exists and defines 7 stages with allowed moves. Starting the server compiles the YAML and serves the result via `GET /api/config/compiled`. The compiled config response includes `stages` (the ordered stage list from the YAML), `allowedMoves` (the transition map), and `attentionStates` (the fixed 7-value list from contracts). No `STAGES` or `ALLOWED_MOVES` constants exist in the contracts package.

### Design system (Milestone 1)

After `pnpm build`, open the built HTML. The page uses Tailwind utility classes. CSS custom properties `--background`, `--primary`, `--stage-inbox`, `--state-blocked` etc. are defined in the stylesheet. Fonts load from Google Fonts (Chakra Petch, Outfit, JetBrains Mono). All border-radius values are `0`.

### AppShell and routing (Milestone 2)

Start `make dev`. Navigate to each route (`/`, `/dashboard`, `/feed`, `/projects`, `/system`, `/settings`, `/tasks/test-task-1`). Every route renders inside the AppShell. The top bar persists. The active nav tab is highlighted. Direct-URL navigation (typing a URL and pressing Enter) works without a 404. Browser back/forward buttons work.

### Board (Milestone 3)

At `/`, the board displays columns matching the stages defined in `.deliverator/workflow.yaml` — by default: INBOX, DISCOVERY, RESEARCH, BUILD/TEST, FEEDBACK, DEPLOY, DONE. The column list is read from the compiled config API response, not hardcoded in the UI. Seeded tasks appear as cards in their respective columns. Each card shows an attention state badge with the correct color, task title, and stage dot. The DONE column is collapsed by default. Clicking a card navigates to `/tasks/:taskId`.

### Task detail (Milestone 4)

At `/tasks/:taskId`, the page shows: back link, task title in Chakra Petch, stage dot + label, attention state badge, project name. The tab bar shows Overview (active), Plan & Artifacts, Runs, Comments. The overview tab displays the task summary and key metrics. Other tabs show placeholder content.

### SSE and data flow (Milestone 5)

Open browser DevTools Network tab. An EventSource connection to `/api/events/stream` is visible and stays open. The board data loads from `/api/board`. The stage column structure comes from `GET /api/config/compiled` (which includes the compiled workflow data from `.deliverator/workflow.yaml`). Refreshing the page reloads the board from the API. The SSE connection reconnects after a brief disconnect.

### Cross-cutting

Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` from the repo root. All pass. No `any` types introduced except where documented. No console.log debugging in committed code.


## Idempotence and Recovery

All steps can be re-run safely. The database migration (Milestone 0) uses an idempotent UPDATE that maps old values to new values — running it twice has no effect because the old values no longer exist after the first run. The migration is tracked in the `schema_migrations` table and will not re-execute.

The workflow config loader writes a default `.deliverator/workflow.yaml` only if the file is missing. If the file already exists, it is read as-is. Deleting the file and restarting the server regenerates the default.

Dependency installation (`pnpm add`) is idempotent — running it again installs the same versions from the lockfile.

If the build breaks mid-milestone, fix the issue and re-run `pnpm build`. No manual cleanup is needed.

To start fresh: delete `node_modules` and `.deliverator/` and run `pnpm install && make dev`. The server will regenerate `.deliverator/workflow.yaml` on first startup.


## Artifacts and Notes

### Allowed Moves (from research docs, defined in workflow.yaml)

The allowed manual transitions, per `docs/research/docs/04-workflow-model.md`, are defined in `.deliverator/workflow.yaml`:

    inbox → discovery
    discovery → research
    research → build_test
    feedback → research    (return for rework)
    feedback → deploy      (approve to ship)

Automatic transitions (not manual):

    build_test → feedback  (when all validation passes)
    deploy → done          (after merge and cleanup)

These moves are compiled at server startup and included in the `GET /api/config/compiled` response as the `allowedMoves` field. The UI reads this map to render only valid move buttons. There is no separate `/api/board/schema` endpoint.

### Stage-to-color mapping (from DESIGN_SYSTEM.md)

    inbox:      --stage-inbox      (neutral gray)
    discovery:  --stage-discovery  (blue)
    research:   --stage-research   (violet)
    build_test: --stage-build      (cyan / primary)
    feedback:   --stage-feedback   (amber / secondary)
    deploy:     --stage-deploy     (green)
    done:       --stage-done       (muted gray)

### Attention state badge colors (from DESIGN_SYSTEM.md)

    actively_working:         --state-working   (green, pulsing border)
    awaiting_human_input:     --state-input     (amber)
    awaiting_human_approval:  --state-approval  (gold)
    blocked:                  --state-blocked   (red, elevated weight)
    ready_for_feedback:       --state-feedback  (teal)
    ready_to_archive:         --state-archive   (muted gray, dimmed)
    paused_for_human:         --state-paused    (dark gray)


## Interfaces and Dependencies

### Updated contracts types (Milestone 0)

In `packages/contracts/src/index.ts`:

    // Stages are NOT hardcoded — validated at runtime against compiled workflow config
    const StageSchema = Type.String();

    // Attention states ARE hardcoded — system-level invariants
    const AttentionStateSchema = Type.Union([
      Type.Literal("actively_working"),
      Type.Literal("awaiting_human_input"),
      Type.Literal("awaiting_human_approval"),
      Type.Literal("blocked"),
      Type.Literal("ready_for_feedback"),
      Type.Literal("ready_to_archive"),
      Type.Literal("paused_for_human")
    ]);

    // CompiledConfigSchema updated to include workflow data
    const CompiledConfigSchema = Type.Object({
      generatedAt: Type.String(),
      app: AppConfigSchema,
      stages: Type.Array(WorkflowStageSchema),
      allowedMoves: Type.Record(Type.String(), Type.Array(Type.String())),
      attentionStates: Type.Array(Type.Object({
        id: AttentionStateSchema,
        label: Type.String()
      })),
      operatorShell: Type.Object({
        title: Type.String(),
        subtitle: Type.String()
      })
    });

### Default workflow.yaml (Milestone 0)

Created at `.deliverator/workflow.yaml` (gitignored):

    stages:
      - id: inbox
        label: Inbox
        defaultAttentionState: awaiting_human_input
      - id: discovery
        label: Discovery
        defaultAttentionState: actively_working
      - id: research
        label: Research
        defaultAttentionState: actively_working
      - id: build_test
        label: Build/Test
        defaultAttentionState: actively_working
      - id: feedback
        label: Feedback
        defaultAttentionState: ready_for_feedback
      - id: deploy
        label: Deploy
        defaultAttentionState: actively_working
      - id: done
        label: Done
        defaultAttentionState: ready_to_archive

    allowedMoves:
      inbox: [discovery]
      discovery: [research]
      research: [build_test]
      feedback: [research, deploy]

    automaticMoves:
      build_test: [feedback]
      deploy: [done]

### Board API response shape (Milestone 5)

`GET /api/board` returns:

    interface BoardResponse {
      columns: Array<{
        stage: string;       // Stage ID from compiled workflow config
        label: string;
        tasks: Array<{
          id: string;
          title: string;
          stage: string;
          attentionState: AttentionState;
          summary: string;
          projectSlug: string;
          lastActivityAt: string | null;
          hasPullRequest: boolean;
        }>;
      }>;
    }

The UI reads `stages`, `allowedMoves`, and `attentionStates` from the `GET /api/config/compiled` response (the compiled workflow config). No separate `/api/board/schema` endpoint is needed.

### New npm dependencies

    yaml                     — YAML parser for workflow config (packages/core dependency)
    @tanstack/react-query    — server state (caching, invalidation, optimistic updates)
    zustand                  — client-only UI state (filters, preferences, dark mode)
    tailwindcss              — utility-first CSS framework
    @tailwindcss/vite        — Tailwind v4 Vite integration
    class-variance-authority — component variant utility (used by shadcn)
    clsx                     — conditional class name joining
    tailwind-merge           — Tailwind class deduplication
    lucide-react             — icon library (used by shadcn components)

### Key new files

    .deliverator/workflow.yaml                   — workflow config (gitignored, local runtime state)
    packages/core/src/workflow-config.ts         — YAML loader/compiler for workflow config
    apps/server/web/app.css                      — design system CSS custom properties
    apps/server/web/lib/utils.ts                 — cn() utility
    apps/server/web/lib/query-client.ts          — TanStack Query client
    apps/server/web/components/app-shell.tsx      — persistent navigation shell
    apps/server/web/components/board.tsx          — kanban board screen
    apps/server/web/components/board-card.tsx     — individual task card
    apps/server/web/components/task-detail.tsx    — task detail parent layout
    apps/server/web/components/task-overview.tsx  — task overview tab
    apps/server/web/hooks/use-board.ts           — board data fetching hook
    apps/server/web/hooks/use-task.ts            — task data fetching hook
    apps/server/web/hooks/use-global-sse.ts      — SSE → query invalidation hook
    packages/db/migrations/002_reconcile_stages.sql — stage/attention migration
