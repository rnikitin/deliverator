# Project Context

## Purpose
DELIVERATOR is a workflow orchestration system for AI CLI agents. The product is board-first and workflow-first: it owns task state, stage transitions, approvals, evidence collection, and operator visibility around automated work. It is not a top-level agent that is free to mutate state however it wants.

The current repository phase is foundation-bootstrapped. This repo already contains the technical foundation: the monorepo, `apps/server`, shared packages, Docker/dev scripts, observability scaffold, architecture research, ADRs, example workflow artifacts, and OpenSpec skills. Changes should advance the implementation one phase at a time rather than re-bootstrap the foundation.

## Tech Stack
- Node.js 22
- TypeScript with strict settings
- pnpm as the package manager
- Fastify as the server runtime
- React + Vite for the UI
- SQLite for v1 persistence
- execa or equivalent for subprocess execution
- AJV for schema validation
- Pino-compatible structured logging

One explicit repo-level decision overrides the older research layout: the Fastify app owns API routes, SSE, and site hosting. Vite is integrated into that Fastify app. Do not introduce a separate frontend runtime in v1 unless a new approved architectural change explicitly replaces this decision.

Repo-local generated runtime state belongs under `.deliverator/` in the repository root. That gitignored directory is the expected home for development databases, worktrees, logs, generated port/env state, and similar local artifacts.

## Domain Context
Core reference material lives under `docs/research/` and is read-only unless the user explicitly asks to modify the imported research pack.

The most important documents are:
- `ARCHITECTURE.md`
- `docs/index.md`
- `docs/PLANS.md`
- `docs/CHANGELOG.md`
- `docs/research/DELIVERATOR.md`
- `docs/research/docs/02-architecture-overview.md`
- `docs/research/docs/03-domain-model.md`
- `docs/research/docs/04-workflow-model.md`
- `docs/research/docs/05-action-recipe-adapter-model.md`
- `docs/research/docs/06-runtime-execution-and-runner.md`
- `docs/research/docs/07-artifacts-and-evidence.md`
- `docs/research/docs/12-mvp-and-build-order.md`
- `docs/research/docs/15-codebase-layout.md`
- `docs/research/docs/adr/README.md`

Important domain ideas:
- board stages and attention state
- workspaces as the execution boundary
- runs and action runs as the execution record
- artifacts and immutable evidence as the continuity layer
- policies and approvals as deterministic workflow controls

## Architecture Patterns
- Keep workflow authority deterministic. State transitions, retries, approvals, and cleanup rules belong in code and schemas, not prompt text.
- Prefer workspace continuity and artifact continuity over session memory.
- Keep action intent, recipe composition, and adapter implementation as separate layers.
- Keep IO at the edge. Core workflow, policy, and state-machine logic should remain pure and testable.
- Preserve immutable evidence for every meaningful automated run.
- Respect hard package boundaries when the monorepo is created. A package should own its contracts and avoid reaching into sibling internals.
- Prefer thin Fastify route handlers. Request parsing, validation, orchestration, and domain logic should live in explicit modules rather than in route closures.
- Treat the state machine as the authority on allowed transitions.

## Code Style
- Use strict TypeScript.
- Prefer named exports over default exports.
- Avoid `any` unless a boundary truly cannot be typed yet, and document the reason.
- Prefer explicit interfaces or type aliases for shared data contracts.
- Prefer discriminated unions and exhaustive `switch` statements for workflow states and result types.
- Prefer small, cohesive modules with obvious control flow. As a default target, keep functions under roughly 50 lines and files under roughly 300 lines unless a cohesive module benefits from more.
- Use structured logs with stable field names rather than ad-hoc debug printing.
- Keep tests close to the package or module they validate once code exists.
- For substantial UI/UX work, use the [$frontend-design](/Users/rnikitin/.codex/skills/frontend-design/SKILL.md) skill to set a clear visual direction before implementation.

## Testing Strategy
- Unit tests for pure logic in core workflow, policy, schema, and state-machine code.
- Integration tests for Fastify route behavior, validation, and request/response boundaries.
- Adapter tests around real process boundaries with controlled fixtures or realistic stubs. Avoid mocking away the boundary you are trying to prove.
- Table-driven tests for workflow transitions, retry rules, and policy matrices where practical.
- Prefer behavior-focused validation:
  - a command returns the expected output
  - an HTTP endpoint returns the expected response
  - a UI path renders the expected state
  - an artifact is produced in the expected location or shape
- If automation is incomplete, include the smallest reliable smoke test and document the remaining gap.

## Code Review Standard
- Review findings first. Prioritize correctness, regression risk, invariant preservation, missing tests, and contract drift.
- Point to concrete failure modes and the exact file and line when possible.
- Verify that the change matches the intended tier:
  - Tier 0: short plan only
  - Tier 1: ExecPlan required
  - Tier 2: ExecPlan and OpenSpec required
- Verify test adequacy based on behavior, not just code coverage.
- Verify logging, evidence, or artifact impact when the change affects runtime behavior.
- Prefer small, reviewable diffs over broad speculative scaffolding.
- If no blocking issues are found, still call out residual risks or validation gaps.

## Git and Change Workflow
- Start by classifying the work:
  - Tier 0: short plan only for trivial, low-risk changes
  - Tier 1: create an ExecPlan first for multi-step or internal behavior-impacting work
  - Tier 2: create an ExecPlan first, then create or update OpenSpec artifacts before implementation
- Use the [$execplan](/Users/rnikitin/.codex/skills/execplan/SKILL.md) skill for Tier 1 and Tier 2 planning and follow `docs/PLANS.md` as the repo-local planning standard.
- OpenSpec is required for:
  - new capabilities
  - user-facing features
  - API/schema/config/public-surface changes
  - architecture or workflow-semantics changes
  - cross-package changes
  - security-sensitive or performance-sensitive work
  - ambiguous work likely to drift without formal artifacts
- Significant UI/UX work should reference the [$frontend-design](/Users/rnikitin/.codex/skills/frontend-design/SKILL.md) skill in the planning artifacts.
- If scope grows during discovery, promote the task to the higher tier and record that in the artifacts.

Implemented changes must be recorded in `docs/CHANGELOG.md`.

## Constraints
- `docs/research/` is reference material, not the implementation surface.
- Do not introduce a separate frontend runtime in v1.
- No ORM in v1 unless a later approved change explicitly introduces one.
- No GraphQL in v1.
- No top-level LLM agent that decides workflow transitions or policy outcomes.
- Build implementation in the order implied by `docs/research/docs/12-mvp-and-build-order.md` instead of skipping directly to late-phase surfaces.
