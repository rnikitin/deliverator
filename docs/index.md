# Repository Knowledge Base

This `docs/` directory is the compact system of record for DELIVERATOR repository knowledge.

Start here:
- `AGENTS.md` — cross-tool collaboration contract
- `CLAUDE.md` — Claude-oriented mirror of the same root policy
- `ARCHITECTURE.md` — high-level codemap
- `docs/PLANS.md` — planning and change-management rules

## Where to Find X

| Need | Source of truth |
| --- | --- |
| Collaboration and workflow policy | `AGENTS.md` |
| Claude-specific workflow mirror | `CLAUDE.md` |
| High-level architecture map | `ARCHITECTURE.md` |
| Planning rules and task triage | `docs/PLANS.md` |
| Implementation history | `docs/CHANGELOG.md` |
| OpenSpec conventions for this repo | `openspec/project.md` |
| Imported architecture and product research | `docs/research/` |
| ADR index from the research pack | `docs/research/docs/adr/README.md` |
| Build order and implementation phases | `docs/research/docs/12-mvp-and-build-order.md` |
| Intended codebase layout | `docs/research/docs/15-codebase-layout.md` |
| Design system and visual language | `docs/DESIGN_SYSTEM.md` |
| App structure and screen architecture | `docs/APP_STRUCTURE.md` |

## Operating Rules

- Keep map documents short. `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md`, and `docs/index.md` should point to deeper docs instead of duplicating all detail.
- Record implemented changes in `docs/CHANGELOG.md`.
- Follow `docs/PLANS.md` to decide whether a short plan, an ExecPlan, or OpenSpec is required.
- The current runtime is one Fastify-hosted site with a Vite-managed React SPA. Do not reintroduce a second frontend runtime or SSR without an explicit new change decision.
- For substantial UI/UX work, use the `frontend-design` skill before implementation.
- Treat `docs/research/` as read-only reference material unless the user explicitly asks to edit it.
