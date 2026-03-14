# Changelog

History of implemented repository changes.

This root file should stay compact:
- short month index for archived months
- full entries for the current month

Detailed monthly archives can be added later under `docs/changelog/`.

## Month Index

- No archived months yet.

## Current Month: 2026-03

### 2026-03-14
- [docs][harness][policy] Added the initial DELIVERATOR harness layer: `AGENTS.md`, `CLAUDE.md`, `openspec/project.md`, `openspec/config.yaml` context/rules, `ARCHITECTURE.md`, `docs/index.md`, `docs/PLANS.md`, and shared Claude settings, including Tier 0/Tier 1/Tier 2 planning rules and frontend-design guidance for substantial UI/UX work.
- [foundation][runtime][obs] Initialized the technical foundation: `pnpm` + `turbo` workspace, unified `apps/server` Fastify + Vite SPA, shared packages, SQLite bootstrap, `make dev` scripts, and the local Grafana/Tempo/Prometheus/Loki/Promtail/OTel stack. The current UI shell is intentionally client-rendered and not SSR-based.
- [workflow][devx] Removed the `make dev-no-obs` path so local startup always includes the observability stack. `make dev` is now the only supported watch-mode entrypoint for the full local environment.
- [storage][devx] Consolidated repo-local runtime state under `.deliverator/`. Development data, worktrees, logs, observability volumes, and generated ports/env state now live in that single gitignored directory.
- [validation][docs] Recorded the current validation boundary: host-run foundation checks are green, while full Docker-backed `make dev` smoke validation still depends on Docker daemon availability in the environment where the stack is being verified.
- [design][docs] Added `docs/DESIGN_SYSTEM.md` defining the visual language: industrial mission control aesthetic, zero border-radius, Chakra Petch / Outfit / JetBrains Mono typography, cool blue-gray + electric cyan + amber palette, 7 attention state treatments, 7 workflow stage colors, shadcn/ui token overrides, and light/dark mode variables.
