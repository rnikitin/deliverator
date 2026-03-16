# Repository Guidelines

## Project Identity
- DELIVERATOR is a workflow orchestration system for AI CLI agents.
- It is a long-running workflow service with a deterministic control plane, not a top-level autonomous agent.
- The current repository state is foundation-bootstrapped and runtime-bearing: the monorepo, `apps/server`, `apps/cli`, shared packages, per-project registry/runtime model, and Bun-based local workflow already exist.

## Current Phase
- This phase focuses on hardening the project-registry runtime, CLI-first local workflow, and per-project storage model without breaking the one-site runtime or deterministic workflow rules.
- Do not re-bootstrap the monorepo or re-argue already-settled repo-level decisions unless the user explicitly asks for a new architectural change.
- Treat the current repo as an implemented foundation plus research pack, not as a docs-only workspace.

## Required Reading
- Before non-trivial work, read:
  - `ARCHITECTURE.md`
  - `docs/index.md`
  - `docs/PLANS.md`
  - `docs/research/DELIVERATOR.md`
  - `docs/research/docs/02-architecture-overview.md`
  - `docs/research/docs/12-mvp-and-build-order.md`
  - `docs/research/docs/15-codebase-layout.md`
  - `docs/research/docs/adr/README.md`
- Read the relevant deep-dive docs before touching those areas:
  - workflow semantics: `docs/research/docs/04-workflow-model.md`
  - action/recipe/adapter contracts: `docs/research/docs/05-action-recipe-adapter-model.md`
  - runtime execution: `docs/research/docs/06-runtime-execution-and-runner.md`
  - artifacts/evidence: `docs/research/docs/07-artifacts-and-evidence.md`
  - backend/API shape: `docs/research/docs/09-backend-api.md`
- `docs/research/` is read-only reference material. Do not edit it unless the user explicitly asks to change the imported research pack.
- The example files under `docs/research/.deliverator/` are product reference material, not active repo config.
- Global DELIVERATOR app state lives under `~/.deliverator`.
- Managed project state lives under `<project>/.deliverator/shared` and `<project>/.deliverator/local`.
- Do not treat the DELIVERATOR app repo root as the global runtime home. If this repo is itself registered as a managed project, only `.deliverator/local/` should stay uncommitted.

## Source of Truth
- `AGENTS.md` is the cross-tool collaboration contract.
- `CLAUDE.md` mirrors the same repo policy for Claude-specific workflows and must stay aligned with `AGENTS.md`.
- `ARCHITECTURE.md` is the short high-level codemap for this repository.
- `docs/index.md` is the knowledge-base table of contents.
- `docs/PLANS.md` defines when to use a short plan, when to use an ExecPlan, and when OpenSpec is required.
- `docs/CHANGELOG.md` records implemented changes and stays compact.
- `openspec/project.md` is the OpenSpec-facing conventions brief.
- Keep maps short and point to deeper docs instead of duplicating large blocks of detail.

## Tech Stack
- Bun 1.3+ as the package manager and primary command runner
- Node.js 22 for the compatible TypeScript/runtime path used by the current SQLite/Fastify stack
- TypeScript with strict settings
- Fastify as the server runtime
- React + Vite for the UI
- SQLite for v1 persistence
- execa or equivalent for subprocess execution
- AJV for schema validation
- Pino-compatible structured logging

## Intended Monorepo Structure
- Use `docs/research/docs/15-codebase-layout.md` as the starting point for package boundaries.
- Repo-level override: do not create a separate frontend runtime in v1.
- The Fastify app owns:
  - API routes
  - SSE streams
  - site hosting
  - Vite integration for the UI
- If a future proposal mentions `apps/web`, treat that as a research-era concept that must be reconciled with the current one-site Fastify rule before implementation.

## Architecture Rules
- Preserve deterministic workflow authority in code. State transitions, retries, approvals, and policy gates must not be delegated to an LLM.
- Prefer workspace and artifacts as the continuity layer over session memory.
- Keep action intent, recipe composition, and adapter implementation separate.
- Preserve immutable run evidence. Mutable workspaces can change or be deleted; evidence must remain reproducible.
- Keep IO at the edges. Core workflow logic, state transitions, and policy decisions should remain explicit and testable.
- Prefer explicit contracts, schemas, and typed boundaries over convention-heavy magic.
- No separate BFF in v1. Fastify is the application server for both API and UI concerns.
- No top-level agent that decides what the workflow is allowed to do.

## Change Triage Policy
- `Tier 0: short plan only`
  - Use for trivial, low-risk work.
  - Examples: typo fixes, formatting-only edits, docs cleanup, tests for existing behavior, narrow bug fixes that restore intended behavior, tiny refactors with no public behavior or contract change.
  - Do not require an ExecPlan or OpenSpec by default.
- `Tier 1: ExecPlan required, OpenSpec optional`
  - Use for multi-step work, internal behavioral changes, or work that spans several files but does not introduce a new capability or architectural shift.
  - Examples: a moderate refactor inside one subsystem, an internal adapter/runner cleanup, or a complex bug fix that needs explicit sequencing.
  - Start with the `execplan` skill. Add OpenSpec only if discovery reveals Tier 2 characteristics.
- `Tier 2: ExecPlan plus OpenSpec required`
  - Use for new capabilities, user-facing features, API/schema/config/public-surface changes, architecture or workflow-semantics changes, cross-package changes, security-sensitive work, performance-sensitive work, or ambiguous work with high drift risk.
  - Sequence: `ExecPlan -> OpenSpec -> implementation`.
- If unsure, choose the higher tier.
- If a task grows during discovery, promote it and record the promotion in the planning artifacts.

## Workflow and Change Management
- Start by deciding which tier the work belongs to.
- For Tier 0 work, write a short concrete plan and then implement.
- For Tier 1 work, create an ExecPlan with the `execplan` skill before implementation.
- For Tier 2 work, create an ExecPlan first, then create or update OpenSpec artifacts, then implement.
- For Tier 1 and Tier 2 work, stop after the ExecPlan is drafted and get explicit user approval before moving into implementation. If OpenSpec is also required, create or update the OpenSpec artifacts, present them for review, and wait for a clear go-ahead before coding.
- Follow `docs/PLANS.md` for the repo-local planning standard.
- Save active ExecPlans under `docs/plans/` and keep them updated as living documents.
- Use the repo's checked-in OpenSpec workflows when doing OpenSpec work.
- For substantial UI or UX work, use the `frontend-design` skill before implementation.
- Record implemented changes in `docs/CHANGELOG.md` before considering the work complete.
- Keep `AGENTS.md` and `CLAUDE.md` aligned in the same change set whenever root policy changes.

## Coding Standards
- Prefer strict TypeScript with explicit types at package boundaries.
- Prefer named exports. Avoid default exports.
- Do not use `any` unless the boundary truly cannot be typed yet, and document why.
- Prefer discriminated unions and exhaustive `switch` handling for workflow state and result types.
- Prefer small modules and small functions with obvious control flow. As a default target, keep functions under roughly 50 lines and files under roughly 300 lines unless a cohesive module benefits from more.
- Keep pure logic separate from adapters, filesystem access, process execution, and HTTP handling.
- Use structured logs with stable field names. Do not rely on ad-hoc `console.log` debugging in committed code.
- Prefer interfaces or explicit type aliases for shared data contracts.
- Co-locate tests with the module or package they validate once code exists.

## Testing Standards
- No change is done without a stated verification path.
- Test pure logic with unit tests first.
- Test HTTP and Fastify route behavior with integration tests.
- Test adapter and process-execution boundaries with controlled fixtures or realistic stubs around the real boundary.
- Test state transitions and workflow semantics with table-driven cases where practical.
- Phrase validation in observable terms:
  - command output
  - HTTP response
  - rendered UI behavior
  - produced artifact
- For Tier 1 and Tier 2 work, the plan must state what fails before the change and what passes after it.
- If full automation is not yet available, include the smallest reliable smoke test and call out the remaining gap explicitly.

## Architecture and Design Expectations
- Start from boundaries: package ownership, contracts, runtime location, and failure behavior.
- Keep workflow decisions explicit in code and schema, not hidden in prompt text.
- Introduce one vertical slice at a time rather than scaffolding the whole roadmap up front.
- Reconcile new work with the build order in `docs/research/docs/12-mvp-and-build-order.md`.
- For significant UI surface work, treat visual direction, responsiveness, accessibility, and interaction quality as first-class design requirements rather than finishing touches.
- Use the `frontend-design` skill for complex pages, dashboards, landing surfaces, or large UX redesigns.
- When introducing a new subsystem, specify:
  - why it belongs in the current phase
  - what contract it exposes
  - what state it owns
  - how it is validated
- If a design deviates from the research pack, state the override clearly in the plan or OpenSpec artifacts.

## Code Review Expectations
- Default to a findings-first review style.
- Review for:
  - behavioral regressions
  - invariant drift
  - contract or schema drift
  - missing tests
  - evidence/logging gaps
  - avoidable complexity
- When raising a concern, explain the failure mode and point to the exact file and line if possible.
- Prefer comments about correctness, safety, and maintainability over style nitpicks.
- If no blocking findings exist, still call out residual risks or missing validation.
- Large or cross-cutting changes should be split or staged unless a single diff is genuinely clearer.

## Commands
- Common repo-level commands:
  - `openspec list`
  - `openspec validate`
  - `bun install`
  - `bun run dev`
  - `bun run start`
  - `bun run open`
  - `bun run logs -- --grep <text>`
  - `bun run build`
  - `bun run test`
  - `bun run lint`
  - `bun run typecheck`
- When documenting commands, always state the working directory and the observable success condition.

## Out of Scope for This Phase
- No git bootstrap or repo hygiene automation unless explicitly requested.
- No Docker-first runtime path or observability stack revival unless explicitly requested through a new approved architectural change.
- No committed repo-root `.deliverator/` app-state directory. Global app state belongs in `~/.deliverator`, while project-local `.deliverator/` trees belong to managed projects.
- No deployment automation yet.
- No nested policy files unless the repo grows enough to justify them.
