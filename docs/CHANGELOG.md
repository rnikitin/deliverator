# Changelog

History of implemented repository changes.

This root file should stay compact:
- short month index for archived months
- full entries for the current month

Detailed monthly archives can be added later under `docs/changelog/`.

## Month Index

- No archived months yet.

## Current Month: 2026-03

### 2026-03-16
- [architecture][runtime][storage] Switched DELIVERATOR to the per-project runtime model: global app state now lives under `~/.deliverator`, while each managed project owns `<project>/.deliverator/shared` and `<project>/.deliverator/local`.
- [runtime][cli][logs] Added the CLI-first local runtime surface around `deliverator start`, `deliverator open`, and `deliverator logs`, with JSONL logs as the supported local diagnostic path instead of the previous observability stack.
- [tooling][bun] Moved the workspace to Bun as the package manager and primary command runner. The supported contributor path is now `bun install`, `bun run dev`, `bun run start`, `bun run lint`, `bun run test`, and `bun run typecheck`.
- [docs][oss] Rewrote `README.md` to describe the product and its advantages, added `DEVELOPMENT.md` for contributor setup and troubleshooting, and updated repo policy/docs to remove Docker-first guidance.

### 2026-03-14
- [docs][harness][policy] Added the initial DELIVERATOR harness layer: `AGENTS.md`, `CLAUDE.md`, `openspec/project.md`, `openspec/config.yaml` context/rules, `ARCHITECTURE.md`, `docs/index.md`, `docs/PLANS.md`, and shared Claude settings, including Tier 0/Tier 1/Tier 2 planning rules and frontend-design guidance for substantial UI/UX work.
- [foundation][runtime][obs] Initialized the technical foundation: `pnpm` + `turbo` workspace, unified `apps/server` Fastify + Vite SPA, shared packages, SQLite bootstrap, `make dev` scripts, and the local Grafana/Tempo/Prometheus/Loki/Promtail/OTel stack. The current UI shell is intentionally client-rendered and not SSR-based.
- [workflow][devx] Removed the `make dev-no-obs` path so local startup always includes the observability stack. `make dev` is now the only supported watch-mode entrypoint for the full local environment.
- [storage][devx] Consolidated repo-local runtime state under `.deliverator/`. Development data, worktrees, logs, observability volumes, and generated ports/env state now live in that single gitignored directory.
- [validation][docs] Closed the initial foundation validation gap: host-run checks and Docker-backed `make dev-start` plus `make smoke-services` now pass in an environment with a working Docker daemon.
- [design][docs] Added `docs/DESIGN_SYSTEM.md` defining the visual language: industrial mission control aesthetic, zero border-radius, Chakra Petch / Outfit / JetBrains Mono typography, cool blue-gray + electric cyan + amber palette, 7 attention state treatments, 7 workflow stage colors, shadcn/ui token overrides, and light/dark mode variables.
- [public][docs][oss] Hardened the public repository surface: removed machine-specific path references from public docs, added `CONTRIBUTING.md` and `LICENSE`, and documented contributor workflow in tool-agnostic terms.
- [design][docs] Added `docs/APP_STRUCTURE.md` defining the screen architecture: route map (11 routes across 7 screens), top-bar navigation model, per-screen content and interactions, TanStack Query + Zustand data flow, SSE integration pattern, API endpoint inventory, operator workflow mapping, and phased build priority (A–H).
- [workflow][docs][ci] Added closeout guidance for archiving completed OpenSpec changes, documented OpenSpec telemetry noise handling, strengthened `corepack`/`pnpm` onboarding, added GitHub Actions validation for `pnpm typecheck`/`lint`/`test`, and moved Docker-backed `make dev-start` plus `make smoke-services` validation into a separate manual/nightly workflow instead of making it part of the default CI gate.

### 2026-03-15
- [contracts][workflow] Reconciled contracts: `StageSchema` is now `Type.String()` (runtime-validated against compiled workflow), `AttentionStateSchema` is a fixed 7-value union, added `CompiledStageSchema`/`CompiledWorkflowSchema` types and `ATTENTION_STATES` metadata constant. Removed hardcoded stage vocabulary from contracts.
- [workflow][core] Added workflow YAML compiler in `packages/core`: loads `.deliverator/workflow.yaml`, compiles stages/allowed-moves at startup, auto-creates default if missing. Single source of truth in `defaults.ts`.
- [init][core] Added `initializeProductConfig()` — scaffolds the full `.deliverator/` product config directory at startup (workflow, 6 recipes, 5 schemas, 10 prompts, 1 validator) from built-in defaults. Idempotent; never overwrites existing files.
- [migration][db] Added `002_reconcile_stages.sql` migrating old placeholder stage/attention-state values to research-defined values in both `tasks` and `runs` tables.
- [design][ui] Installed Tailwind CSS v4, set up CSS custom properties from `DESIGN_SYSTEM.md` (foundations, attention states, stage tokens, light + dark mode), Google Fonts (Chakra Petch, Outfit, JetBrains Mono), zero border-radius overrides. Replaced old `styles.css`.
- [ui][routing] Built the AppShell (48px sticky top bar, primary nav tabs, `<Outlet>`) with full 11-route map including nested task detail routes. Added `QueryClientProvider` and Zustand. SPA catch-all replaces individual route handlers.
- [ui][board] Built the Board screen: 7 stage columns with colored headers, task cards with attention state badges/borders/visual treatments, collapsible done column. Connected to `GET /api/board` via TanStack Query.
- [ui][task] Built the Task Detail screen: persistent header with stage dot and attention badge, 4-tab layout (Overview, Plan & Artifacts, Runs, Comments), overview tab with summary/details, action bar placeholder.
- [api][db] Added `GET /api/board` (tasks grouped by stage columns) and `GET /api/board/schema` (stages, allowed moves, attention states) endpoints. Added `getAllTasksForBoard()` DB query.
- [sse][ui] Added `useGlobalSSE()` hook: connects to `/api/events/stream`, invalidates board and task queries on relevant events. Mounted in AppShell.
