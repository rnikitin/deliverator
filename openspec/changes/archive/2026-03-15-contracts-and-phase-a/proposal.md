## Why

The DELIVERATOR UI is currently placeholder pages — an informational landing screen and a raw task detail view with no real operating surface. Before any product-quality screen work can begin, two blockers must be resolved: (1) the contracts package defines placeholder workflow stages and attention states that don't match the research-defined workflow model, and (2) there is no design system implementation, no component library, no data fetching layer, and no application shell to host screens. This change removes both blockers and delivers the first real operating surface — a kanban board — so operators can see tasks across workflow stages and click through to task detail.

## What Changes

- **BREAKING**: Replace the placeholder `StageSchema` in `packages/contracts` with `Type.String()`. Stages are no longer a compile-time union; they are runtime-validated against the workflow configuration loaded from `.deliverator/workflow.yaml`. All downstream type consumers must update.
- **BREAKING**: Replace the 4 placeholder attention states (`normal`, `needs_human`, `waiting_on_dependency`, `failed`) with the 7 research-defined attention states (`actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`) as a fixed TypeBox union. Attention states are system-level concepts, not workflow-configurable. All downstream type consumers must update.
- Remove `STAGES` and `ALLOWED_MOVES` constants from `packages/contracts`. Stage vocabulary and transition rules come from `.deliverator/workflow.yaml`, not from hardcoded constants.
- Create a default `.deliverator/workflow.yaml` with the 7 research-defined stages and their transitions, auto-created on fresh checkout if missing.
- Add a workflow YAML loader/compiler in `packages/core` that reads `.deliverator/workflow.yaml` at server startup and compiles it into an in-memory structure with stage order, labels, allowed moves, and stage metadata.
- Add a database migration to map existing task rows from old stage/attention values to new values.
- Update the seed script to use the new vocabulary.
- Install Tailwind CSS v4 and shadcn/ui dependencies. Create CSS custom properties implementing all design system tokens from `docs/DESIGN_SYSTEM.md` (foundations, attention states, workflow stages, light/dark mode).
- Replace the current custom CSS (IBM Plex Sans, glassmorphism cards) with the design system aesthetic (Chakra Petch / Outfit / JetBrains Mono, zero border-radius, borders over shadows).
- Install TanStack Query for server state and Zustand for UI state, replacing raw `fetch()` + `useEffect` patterns.
- Create a persistent `AppShell` layout component with the 48px sticky top bar, wordmark, primary nav tabs, and `<Outlet>` for child routes.
- Expand the React Router route map from 2 routes to the full 11-route structure defined in `docs/APP_STRUCTURE.md`, with placeholder screens for screens not yet built.
- Create the Board screen at `/` — columns driven by the compiled workflow config, task cards colored by attention state, stage column headers, and click-to-detail navigation.
- Create the Task Detail parent layout at `/tasks/:taskId` with persistent header, tab bar (Overview, Plan & Artifacts, Runs, Comments), and bottom action bar. Build the Overview tab; other tabs render placeholder content.
- Add `GET /api/board` endpoint returning all tasks grouped by stage for the kanban view, with stage order from compiled workflow config.
- Add `GET /api/board/schema` endpoint returning allowed moves and filter options from compiled workflow config.
- Wire the existing SSE endpoint to TanStack Query invalidation so board and task queries refresh on server events.

## Capabilities

### New Capabilities

- `workflow-contracts`: TypeBox schemas for workflow domain types. `StageSchema` is `Type.String()` (runtime-validated against workflow config, not a compile-time union). `AttentionStateSchema` is a fixed 7-value union (system-level). Exports attention state metadata (labels) but not stage constants or allowed moves — those come from the compiled workflow config.
- `workflow-config-compiler`: A YAML loader/compiler in `packages/core` that reads `.deliverator/workflow.yaml` at server startup and produces an in-memory `CompiledWorkflow` structure containing ordered stages with labels, allowed transitions, stage modes, and board layout metadata. Creates a default workflow file if none exists.
- `design-system-impl`: CSS custom properties, Tailwind configuration, shadcn/ui setup, and the `cn()` utility implementing the visual language from `docs/DESIGN_SYSTEM.md`. Covers foundations (colors, spacing, borders), attention state tokens, stage tokens, and light/dark mode.
- `app-shell`: The persistent navigation shell — top bar with wordmark, primary nav tabs, attention badge slot, settings gear, dark/light toggle, and `<Outlet>` routing. Owns the global SSE connection and TanStack Query provider.
- `board-screen`: The kanban board at `/` — 7 stage columns, task cards with attention state badges and stage dots, column headers with counts, done-column collapse, and click-to-detail navigation. Data from `GET /api/board`.
- `task-detail-screen`: The task detail view at `/tasks/:taskId` — persistent header with back link, title, stage, attention state, project; tab bar with nested routes; Overview tab with summary, metrics, latest artifacts placeholder, latest comments placeholder; bottom action bar placeholder.

### Modified Capabilities

- `technical-foundation`: The contracts package types change (stage becomes `string`, attention states become a 7-value union), the database schema gains a migration, and the seed script updates. The compiled config in `packages/core` now includes the compiled workflow data loaded from `.deliverator/workflow.yaml`. New npm dependencies are added to `apps/server`. New API routes are registered in the Fastify app.

## Impact

- **Packages changed**: `packages/contracts` (schemas + types), `packages/db` (migration + seed + new queries), `packages/core` (compiled config + workflow compiler), `apps/server` (routes, Vite config, all web/ files).
- **API surface**: Two new endpoints (`/api/board`, `/api/board/schema`). Existing `/api/tasks/:taskId` response shape enriched with project info. Existing `/api/config/compiled` response changes (includes compiled workflow data).
- **Dependencies added**: `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@tanstack/react-query`, `zustand`, `js-yaml` (or equivalent YAML parser).
- **Breaking type changes**: `Stage` becomes `string` (was a union — code referencing old literals needs updating). `AttentionState` union changes values — any code referencing old literals will fail typecheck.
- **New runtime dependency**: `.deliverator/workflow.yaml` must exist at startup. The workflow compiler auto-creates a default if missing.
- **Database**: New migration `002_reconcile_stages.sql` updates existing rows. Irreversible (old values are overwritten).
- **Build order**: Aligns with Phase A from `docs/APP_STRUCTURE.md` and the "Milestone 1" scope from `docs/research/docs/12-mvp-and-build-order.md` (core types → board → task detail).
- **UI/UX**: Uses the `frontend-design` skill guidance from `docs/DESIGN_SYSTEM.md`. The visual direction is industrial mission control: zero border-radius, borders over shadows, Chakra Petch headings, compact density, attention-state-colored card borders.
