# Contributing to DELIVERATOR

Thanks for contributing. DELIVERATOR is an early-stage workflow orchestration system for AI CLI agents, and the repository is still building out its product surface on top of a working technical foundation.

## Before You Start

- Read `README.md` for the current runtime and local development flow.
- Read `AGENTS.md` and `docs/PLANS.md` for the repo workflow and planning rules.
- Read `ARCHITECTURE.md` and `docs/index.md` before changing architecture, workflows, or shared package boundaries.
- Treat `docs/research/` as imported reference material unless the change explicitly targets that research pack.

## Planning Tiers

This repository uses a three-tier planning model.

- Tier 0: short plan only
  - Use for trivial, low-risk work such as typo fixes, docs cleanup, formatting-only edits, narrow bug fixes that restore intended behavior, or tiny refactors with no contract or behavior change.
- Tier 1: ExecPlan required, OpenSpec optional
  - Use for multi-step work, internal behavior changes, or work that spans several files but does not introduce a new capability or architectural shift.
- Tier 2: ExecPlan and OpenSpec required
  - Use for new capabilities, user-facing features, API/schema/config/public-surface changes, architecture or workflow-semantics changes, cross-package changes, or other high-risk work.

If you are unsure which tier applies, choose the higher one.

## Workflow

For Tier 0:
- write a short concrete plan
- implement
- validate the change

For Tier 1:
- create an ExecPlan under `docs/plans/YYYY-MM-DD-<slug>.md`
- stop for explicit approval before implementation
- implement after approval
- validate and update docs/changelog as needed

For Tier 2:
- create an ExecPlan first
- stop for explicit approval before implementation
- create or update the OpenSpec change
- present the OpenSpec artifacts for review and wait for a clear go-ahead
- implement against the approved artifacts
- validate and update docs/changelog as needed

If scope grows during discovery, promote the work to the next tier and record that decision in the planning artifacts.

## Validation Expectations

Before calling a change done, run the smallest meaningful validation set for the scope. Common commands from the repo root are:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `make dev`
- `make smoke-services`
- `openspec validate <change-name>`

Validation should be stated in observable terms:
- a command exits successfully
- an HTTP endpoint returns the expected response
- a page renders the expected state
- an artifact or log entry is produced in the expected place

If full automation is not available, document the remaining validation gap explicitly instead of hand-waving it away.

## Architecture and Code Expectations

- Keep workflow authority deterministic. State transitions, approvals, and policy gates belong in code and schemas, not prompt text.
- Keep IO at the edges and keep core workflow logic explicit and testable.
- Preserve the one-site architecture: Fastify owns the API, SSE, and UI hosting.
- Do not introduce a separate frontend runtime or SSR without a new approved architectural change.
- Prefer strict TypeScript, named exports, explicit contracts, and structured logs.
- Keep repo-local generated state under `.deliverator/`. That directory is local runtime state and stays out of version control.

For substantial UI or UX work, start with a design brief. If you are using the repository's AI workflows, that usually means the `frontend-design` skill before implementation.

## Docs and Changelog

Implemented changes should keep the repo docs in sync:

- update `docs/CHANGELOG.md`
- update `AGENTS.md` and `CLAUDE.md` together when root policy changes
- update `openspec/project.md` when repo-wide conventions change
- update `README.md` or `ARCHITECTURE.md` when the contributor-facing story changes

## Review Style

Reviews in this repo should be findings-first:

- call out correctness issues, invariant drift, contract drift, missing tests, and evidence/logging gaps first
- point to concrete failure modes and exact files when possible
- mention residual risk even when there are no blocking findings

Small, reviewable diffs are preferred over speculative broad rewrites.
