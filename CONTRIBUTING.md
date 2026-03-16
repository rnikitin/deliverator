# Contributing to DELIVERATOR

Start here:
- [README.md](./README.md) for the product overview
- [DEVELOPMENT.md](./DEVELOPMENT.md) for local setup and commands
- [AGENTS.md](./AGENTS.md) and [docs/PLANS.md](./docs/PLANS.md) for repo workflow rules

## Planning Tiers

This repo uses a three-tier planning model:
- Tier 0: short plan only
- Tier 1: ExecPlan required
- Tier 2: ExecPlan plus OpenSpec required

If unsure, choose the higher tier.

## Workflow

For Tier 0:
- write a short concrete plan
- implement
- validate

For Tier 1:
- create an ExecPlan under `docs/plans/YYYY-MM-DD-<slug>.md`
- stop for explicit approval before implementation
- implement after approval

For Tier 2:
- create an ExecPlan first
- stop for explicit approval before implementation
- create or update the OpenSpec change
- present the OpenSpec artifacts for review
- wait for a clear go-ahead before coding

If scope grows during discovery, promote the task and record that in the planning artifacts.

## Validation

Common repo-root commands:

```bash
bun run typecheck
bun run lint
bun run test
bun run dev
openspec validate <change-name>
```

State validation in observable terms:
- a command exits successfully
- an endpoint responds with the expected body
- a page renders the expected state
- a log entry or artifact is created where expected

## Code and Architecture Expectations

- Keep workflow authority deterministic.
- Keep IO at the edges and core workflow logic explicit.
- Preserve the one-site architecture: Fastify owns API, SSE, and site hosting.
- Keep global app state in `~/.deliverator`.
- Keep managed project state in `<project>/.deliverator/shared` and `<project>/.deliverator/local`.
- Prefer strict TypeScript, named exports, explicit contracts, and structured logs.

For substantial UI or UX work, use the `frontend-design` skill before implementation.

## Docs

Implemented changes should keep docs in sync:
- update [docs/CHANGELOG.md](./docs/CHANGELOG.md)
- update [README.md](./README.md) when the product story changes
- update [DEVELOPMENT.md](./DEVELOPMENT.md) when setup, commands, or validation change
- update [AGENTS.md](./AGENTS.md) and [CLAUDE.md](./CLAUDE.md) together when root policy changes

## Review Style

Reviews in this repo should be findings-first:
- correctness and regressions first
- invariant and contract drift next
- missing tests and validation gaps next
- residual risk even when there are no blockers
