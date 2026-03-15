## Context

DELIVERATOR's repository has a working technical foundation: a pnpm + Turbo monorepo, a Fastify server with Vite-integrated React SPA, SQLite persistence, and a full observability stack. But the UI is two placeholder pages with raw `fetch()` calls, no component library, and a custom CSS file that does not match the design system. The contracts package defines placeholder stage and attention state enums that predate the research-defined workflow model.

This change spans four packages (`packages/contracts`, `packages/db`, `packages/core`, `apps/server`) and introduces foundational UI infrastructure (Tailwind, shadcn/ui, TanStack Query, Zustand) alongside the first two real screens (Board, Task Detail). The design must ensure these cross-cutting changes compose cleanly without breaking the existing health/readiness/SSE foundation.

Relevant architectural constraints:
- ADR-0002 (deterministic core): workflow transitions, allowed moves, and stage semantics are defined in code, not delegated to an LLM or inferred at runtime.
- ADR-0003 (TypeScript + Fastify + React + SQLite): all new code stays within this stack.
- ADR-0004 (no separate BFF): the Fastify app remains the single runtime for API, SSE, and UI.
- The design system is fully specified in `docs/DESIGN_SYSTEM.md` — tokens, typography, colors, component guidelines, and layout patterns.
- The screen architecture is defined in `docs/APP_STRUCTURE.md` — route map, navigation model, data flow, and build priority.

## Goals / Non-Goals

**Goals:**

- Align the `Stage` and `AttentionState` types across all packages with the research-defined 7-stage, 7-attention-state vocabulary.
- Implement the design system tokens as CSS custom properties and Tailwind configuration so all future UI work inherits the correct visual language.
- Establish the AppShell layout with top-bar navigation and `<Outlet>` routing as the persistent frame for all screens.
- Deliver a working kanban board at `/` that renders tasks across 7 stage columns with attention-state-colored cards.
- Deliver a task detail view at `/tasks/:taskId` with a persistent header, tab bar, and Overview tab.
- Introduce TanStack Query and Zustand as the standard data fetching and UI state patterns, replacing raw `fetch()`.
- Wire the existing SSE endpoint to TanStack Query cache invalidation so the board reflects server-side changes.

**Non-Goals:**

- Drag-and-drop on the board (Phase C).
- Board filters, search, or command palette (Phase C+).
- Task Detail tabs beyond Overview (Plan & Artifacts, Runs, Comments are Phase B).
- Move/approve actions in the UI (Phase C).
- Dashboard, Feed, Projects, System, or Settings screens (Phases D–H).
- Real-time log streaming in the UI.
- Authentication or multi-user support.
- Server-side rendering (SSR).
- Mobile-optimized responsive layouts (the board requires min ~1024px; responsive breakpoints are defined in the design system but full mobile UX is deferred).

## Decisions

### D1: Stages are runtime-configured, attention states are system-fixed

`StageSchema` in `packages/contracts` is `Type.String()`. Contracts defines the schema shape but does not own the stage vocabulary as literals. Concrete stages (their names, order, labels, and allowed transitions) come from `.deliverator/workflow.yaml`, compiled at server startup by `packages/core`. This means the set of stages can change without modifying code or recompiling contracts.

`AttentionStateSchema` remains a fixed 7-value TypeBox union in contracts. Attention states are system-level concepts that describe the task's relationship to humans and the runtime — they are not workflow-configurable. Every package can import the `AttentionState` type and rely on compile-time checking for attention state values.

Alternative considered: keeping stages as a compile-time union in contracts. Rejected because stage vocabulary is a workflow concern that users should be able to customize via configuration. Hardcoding stages in contracts forces a code change and recompilation for what is fundamentally a workflow configuration choice.

### D1a: Workflow YAML format and compilation model

The workflow configuration lives in `.deliverator/workflow.yaml` following the format defined in the research pack (`docs/research/.deliverator/workflow.yml`). At server startup, a workflow compiler in `packages/core` reads this file and produces a `CompiledWorkflow` in-memory structure containing: ordered stage list (with id, label, mode), allowed manual transitions per stage, board column order, and policy metadata.

If `.deliverator/workflow.yaml` does not exist (e.g., fresh checkout), the compiler auto-creates one from a built-in default that matches the research-defined 7-stage workflow. This ensures the server always starts successfully.

The compiled workflow is injected into the server's application context at startup and is available to all route handlers and services. It is not re-read during the server's lifetime — a restart is required to pick up workflow changes.

### D1b: Attention states are system-fixed, not workflow-configured

Attention states (`actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`) are fixed in contracts because they represent system-level semantics: the runtime sets attention states based on gate outcomes, human interaction requirements, and error conditions. Workflow configuration controls which stages exist and how tasks move between them, but the set of possible attention states is a platform invariant.

Contracts exports an `ATTENTION_STATES` metadata constant with id and label for each attention state. This is the only vocabulary constant exported from contracts — stage metadata comes from the compiled workflow.

### D2: Database migration with value mapping, not schema rebuild

A new migration (`002_reconcile_stages.sql`) uses UPDATE statements to map old values to new values in the `tasks`, `runs`, and `task_events` tables. This preserves existing row IDs and relationships.

Alternative considered: dropping and recreating tables. Rejected because it destroys seed data and any developer-created state. The mapping approach is idempotent (running twice is safe because the old values no longer exist after the first run).

Stage mapping: `triage` → `inbox`, `ready` → `discovery`, `in_progress` → `build_test`, `review` → `feedback`, `blocked` → `inbox` (with attention set to `blocked`), `done` → `done`.

Attention mapping: `normal` → `actively_working`, `needs_human` → `awaiting_human_input`, `waiting_on_dependency` → `paused_for_human`, `failed` → `blocked`.

### D3: Tailwind CSS v4 with Vite plugin

Tailwind v4 uses a Vite plugin (`@tailwindcss/vite`) instead of PostCSS configuration. This is simpler to configure and aligns with the existing Vite build pipeline. The CSS custom properties from `docs/DESIGN_SYSTEM.md` are defined in `apps/server/web/app.css` and referenced by Tailwind's theme extension.

Alternative considered: Tailwind v3 with PostCSS. Rejected because v4 is the current release, has better Vite integration, and the project has no legacy Tailwind code to migrate.

### D4: shadcn/ui component primitives, not a full component library install

shadcn/ui components are copied into the project (under `apps/server/web/components/ui/`) rather than installed as a package. This gives full control over styling overrides — critical for the zero-border-radius design system requirement. Components are added as needed, not all at once.

Initial components needed: Button, Badge, Tabs, Card, ScrollArea, Separator.

### D5: TanStack Query for all server data, Zustand for UI-only state

TanStack Query handles caching, background refetching, and cache invalidation for all API data. Zustand stores UI-only concerns: dark mode preference, filter state, command palette visibility, notification counts.

This separation means components never mix server state management with UI state. Query keys follow the convention `["entity", ...params]` (e.g., `["board"]`, `["task", taskId]`).

Alternative considered: using React Context for server state. Rejected because Context re-renders all consumers on any state change and provides no caching or deduplication — TanStack Query solves these by design.

### D6: Global SSE hook invalidates TanStack Query cache

A `useGlobalSSE()` hook mounted in AppShell connects to the existing `/api/events/stream` endpoint. When the server emits task-related events, the hook calls `queryClient.invalidateQueries()` with the relevant query keys. This triggers background refetches rather than injecting data directly into the cache, which keeps the query layer as the single source of truth for server data.

Alternative considered: directly updating the cache from SSE event payloads. Rejected because it would require the SSE payload to exactly match the query response shape — a coupling that is fragile and hard to maintain.

### D7: Board API returns pre-grouped data

`GET /api/board` returns tasks already grouped into stage columns rather than returning a flat list that the client groups. This keeps the grouping logic on the server where it can be tested deterministically and avoids the client needing to know the stage order.

The response shape includes a `columns` array with stage metadata and nested task arrays. The stage order comes from the compiled workflow config, not from hardcoded constants. The server reads the `CompiledWorkflow` to determine column order, labels, and allowed moves.

### D8: SPA catch-all routing via Fastify

Every client-side route needs a corresponding Fastify handler that returns the SPA HTML so that direct URL navigation and browser refresh work. Rather than registering each route individually (current approach), use a wildcard catch-all registered after API routes. This ensures new client routes don't require server changes.

The catch-all must be registered after all `/api/*`, `/healthz`, `/readyz`, and `/api/metrics` routes so it doesn't intercept API requests.

### D9: Placeholder screens for future routes

All routes from `docs/APP_STRUCTURE.md` are registered immediately in the React Router config, but screens not in Phase A (Dashboard, Feed, Projects, System, Settings, and Task Detail tabs beyond Overview) render a simple placeholder component showing the screen name. This ensures the AppShell navigation is complete from day one and that route-level code splitting can be added later without restructuring.

## Risks / Trade-offs

**[Risk: Tailwind v4 is relatively new]** → The project has no existing Tailwind code, so there's no migration risk. If v4 has edge cases, falling back to v3 with PostCSS is straightforward since the CSS custom properties are framework-agnostic.

**[Risk: Breaking type change cascades through all packages]** → Mitigated by running `pnpm typecheck` as the first step after changing contracts. The TypeScript compiler will find every reference to old literals. The migration order (contracts → db → core → server) ensures each layer is fixed before the next.

**[Risk: Database migration is irreversible]** → Acceptable because (a) the old values were placeholders with no production data, (b) `make dev` can recreate the database from scratch via seed, and (c) the migration is idempotent. A developer who needs to reset can delete `.deliverator/data/deliverator.db` and re-run migrations + seed.

**[Risk: SSE invalidation can cause excessive refetches]** → Mitigated by TanStack Query's built-in deduplication — multiple invalidations within the stale window collapse into a single refetch. The board query has a stale time of 30 seconds; invalidation triggers an immediate background refetch but does not block the UI.

**[Risk: Board with 7 columns needs ~1400px minimum]** → The design system defines breakpoint behavior (`sm` through `2xl`) with horizontal scrolling for narrow viewports. Phase A implements the `xl`+ layout only; responsive column collapsing for smaller viewports is deferred.

**[Risk: Workflow YAML missing on fresh checkout]** → Mitigated by auto-creation. The workflow compiler in `packages/core` checks for `.deliverator/workflow.yaml` at startup. If the file does not exist, it writes a built-in default matching the research-defined 7-stage workflow before compiling. This means developers never see a startup failure due to a missing workflow file. The `.deliverator/` directory is gitignored, so the auto-created file is local state and does not pollute the repository.

**[Risk: Stage validation is runtime-only, not compile-time]** → Accepted trade-off. With `StageSchema` as `Type.String()`, the TypeScript compiler will not catch invalid stage literals at build time. Stage values are validated at runtime against the compiled workflow (e.g., in API input validation and database operations). This is the correct trade-off because stages are user-configurable — compile-time checking of a runtime-configurable value would be contradictory.

**[Trade-off: Placeholder screens add unused route registrations]** → Accepted because the navigation shell needs all tabs visible to feel complete, and the code cost is trivial (one component per placeholder returning a heading).

## Open Questions

None — all architectural decisions are grounded in existing ADRs, the design system doc, and the app structure doc. Implementation details are specified in the ExecPlan at `docs/plans/2026-03-14-contracts-and-phase-a.md`.
