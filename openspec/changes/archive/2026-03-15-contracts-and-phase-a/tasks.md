## 1. Contracts and Workflow Config

- [x] 1.1 Update `StageSchema` in `packages/contracts/src/index.ts` to `Type.String()` (runtime-validated, not a compile-time union)
- [x] 1.2 Update `AttentionStateSchema` in `packages/contracts/src/index.ts` to a fixed 7-value union: `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`
- [x] 1.3 Add `ATTENTION_STATES` metadata array export (id + label for each attention state) — this is the only vocabulary constant in contracts
- [x] 1.4 Add `CompiledStageSchema` and `CompiledWorkflowSchema` TypeBox types to contracts (schema shape for compiled workflow data)
- [x] 1.5 Remove any existing `STAGES` or `ALLOWED_MOVES` constants from contracts (stage vocabulary comes from workflow config, not contracts)
- [x] 1.6 Create default `.deliverator/workflow.yaml` content as a built-in string constant in `packages/core` (7 stages with labels, modes, and transitions matching research pack)
- [x] 1.7 Add workflow YAML loader/compiler in `packages/core` that reads `.deliverator/workflow.yaml`, auto-creates from default if missing, parses YAML, validates against schema, and produces `CompiledWorkflow` in memory
- [x] 1.8 Update `compileConfig` in `packages/core` to include compiled workflow data (stages, allowedMoves) from the workflow compiler
- [x] 1.9 Run `pnpm typecheck` and fix all downstream type errors in `packages/db`, `packages/core`, `apps/server`

## 2. Database Migration and Seed

- [x] 2.1 Create `packages/db/migrations/002_reconcile_stages.sql` with UPDATE statements mapping old stage values to new and old attention state values to new (including `runs` table)
- [x] 2.2 Update seed script in `apps/server/src/scripts/seed.ts` to use new stage and attention state values, distributing tasks across at least 3 stages
- [x] 2.3 Verify compiled config includes workflow data from the workflow compiler (stages array with labels comes from compiled workflow, not a hardcoded list)
- [x] 2.4 Verify: `pnpm typecheck && pnpm test` pass with zero errors

## 3. Design System Foundation

- [x] 3.1 Install Tailwind CSS v4 and related dependencies: `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- [x] 3.2 Create `apps/server/web/app.css` with all CSS custom properties from `docs/DESIGN_SYSTEM.md` (foundations, attention states, stage tokens, light + dark mode)
- [x] 3.3 Create or update `tailwind.config.ts` with font families (Chakra Petch, Outfit, JetBrains Mono), border-radius overrides (all `0`), and CSS variable references
- [x] 3.4 Update `apps/server/vite.config.ts` to include the Tailwind v4 Vite plugin
- [x] 3.5 Update `apps/server/web/index.html` with Google Fonts link tags for Chakra Petch, Outfit, JetBrains Mono
- [x] 3.6 Create `apps/server/web/lib/utils.ts` with the `cn()` utility (clsx + tailwind-merge)
- [x] 3.7 Delete `apps/server/web/styles.css` and remove all imports of it
- [x] 3.8 Verify: `pnpm build` succeeds, no CSS errors

## 4. AppShell and Routing

- [x] 4.1 Install `@tanstack/react-query` and `zustand` in `apps/server`
- [x] 4.2 Create `apps/server/web/lib/query-client.ts` exporting a configured `QueryClient` (30s stale time, 1 retry)
- [x] 4.3 Create `apps/server/web/components/app-shell.tsx` — 48px sticky top bar with wordmark, primary nav tabs (Board, Dashboard, Feed, Projects), right-region placeholders (command palette, attention badge, System, settings, dark/light toggle), and `<Outlet>`
- [x] 4.4 Rewrite `apps/server/web/app.tsx` with the full 11-route map wrapped in AppShell layout, including nested task detail routes
- [x] 4.5 Wrap the app in `QueryClientProvider` in `apps/server/web/main.tsx`
- [x] 4.6 Create placeholder components for Dashboard, Feed, Projects, System, Settings (each renders screen name as heading)
- [x] 4.7 Update `apps/server/src/app.ts` — replace individual SPA route handlers with a wildcard catch-all registered after all API routes
- [x] 4.8 Verify: `pnpm build && pnpm typecheck` pass; navigating to every route renders inside AppShell with correct active tab

## 5. Board Screen

- [x] 5.1 Create `apps/server/web/hooks/use-board.ts` — TanStack Query hook fetching `GET /api/board` with query key `["board"]`
- [x] 5.2 Create `apps/server/web/components/board-card.tsx` — task card with 2px left border (attention state color), attention badge, title, stage dot + label, relative last-activity timestamp, click handler navigating to `/tasks/:taskId`
- [x] 5.3 Implement attention state visual treatments on board-card: red tint for `blocked`, pulsing border for `actively_working`, dimmed opacity for `ready_to_archive`
- [x] 5.4 Create `apps/server/web/components/board.tsx` — 7 stage columns in horizontal flex/grid layout (min-width 200px, horizontal scroll), column headers (uppercase Chakra Petch, stage-colored 2px bottom border, count badge), done column collapsed by default with expand toggle
- [x] 5.5 Wire Board component as the `/` route in the router
- [x] 5.6 Verify: `pnpm build && pnpm typecheck` pass; board renders 7 columns with loading state when API is not available

## 6. Task Detail Screen

- [x] 6.1 Create `apps/server/web/hooks/use-task.ts` — TanStack Query hook fetching `GET /api/tasks/:taskId` with query key `["task", taskId]`
- [x] 6.2 Create `apps/server/web/components/task-detail.tsx` — parent layout with back link, title (Chakra Petch), stage dot + label, attention state badge, project name, tab bar (Overview, Plan & Artifacts, Runs, Comments) with active tab highlighting, `<Outlet>` for tab content, bottom action bar with disabled move button placeholders
- [x] 6.3 Create `apps/server/web/components/task-overview.tsx` — overview tab with summary text, key metrics (stage, attention state, timestamps), "Latest artifacts" placeholder section, "Latest comments" placeholder section
- [x] 6.4 Create placeholder components for Plan & Artifacts, Runs, single Run, and Comments tabs
- [x] 6.5 Wire task detail components into nested routes in the router
- [x] 6.6 Verify: `pnpm build && pnpm typecheck` pass; clicking a board card navigates to task detail; back link returns to board; tab navigation works

## 7. Board API and Database Queries

- [x] 7.1 Add `getAllTasksForBoard(context)` query in `packages/db` — returns all tasks joined with latest event timestamp and project slug
- [x] 7.2 Add `getTaskWithDetails(context, taskId)` query in `packages/db` — returns task with project name, project slug, and workspace info
- [x] 7.3 Add `GET /api/board` route handler in `apps/server/src/routes/api.ts` — groups tasks by stage, returns `BoardResponse` shape
- [x] 7.4 Add `GET /api/board/schema` route handler — returns `stages` and `allowedMoves` from compiled workflow config, `attentionStates` from contracts `ATTENTION_STATES` constant
- [x] 7.5 Update `GET /api/tasks/:taskId` handler to return enriched payload with project info
- [x] 7.6 Verify: `pnpm typecheck && pnpm test` pass; `curl localhost:$PORT/api/board` returns JSON with 7 stage columns

## 8. SSE Wiring

- [x] 8.1 Create `apps/server/web/hooks/use-global-sse.ts` — connects to `/api/events/stream`, invalidates `["board"]` on `task.moved`/`attention.changed`, invalidates `["task", taskId]` on `task.updated`
- [x] 8.2 Mount `useGlobalSSE()` in `AppShell`
- [x] 8.3 Verify: browser DevTools shows open EventSource connection to `/api/events/stream`

## 9. Final Validation

- [x] 9.1 Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` from repo root — all pass
- [ ] 9.2 Run `make dev` and verify end-to-end: board loads with seeded tasks in correct columns, card click opens task detail with overview, back link returns to board, top nav tabs navigate between screens, SSE connection is established
- [x] 9.3 Verify no `any` types introduced (except where documented), no `console.log` debugging in committed code
- [x] 9.4 Update `docs/CHANGELOG.md` with the implemented changes
