# Planning and Change Management

DELIVERATOR uses a three-tier planning model so agents do not over-process trivial work and do not under-specify risky changes.

## Tier 0: Short Plan Only

Use a short concrete plan for trivial, low-risk work:
- typo or formatting fixes
- docs cleanup
- tests for existing behavior
- narrow bug fixes that restore intended behavior
- tiny refactors with no contract or behavior change

Tier 0 does not require an ExecPlan or OpenSpec by default.

## Tier 1: ExecPlan Required, OpenSpec Optional

Use an ExecPlan for multi-step work or internal behavioral changes that need sequencing but do not introduce a new capability or architectural shift.

Examples:
- a moderate refactor inside one subsystem
- an internal runner or adapter cleanup
- a complex bug fix that spans several files

For Tier 1:
- use the `execplan` skill first
- save the ExecPlan under `docs/plans/YYYY-MM-DD-<slug>.md`
- keep it updated as a living document
- stop for explicit user approval after the ExecPlan is ready before implementing
- add OpenSpec only if discovery reveals Tier 2 characteristics

## Tier 2: ExecPlan and OpenSpec Required

Use both an ExecPlan and OpenSpec for:
- new capabilities
- user-facing features
- API, schema, config, or public-surface changes
- architecture or workflow-semantics changes
- cross-package changes
- security-sensitive work
- performance-sensitive work
- ambiguous work likely to drift without formal artifacts

For Tier 2:
1. create and maintain the ExecPlan first
2. stop for explicit user approval on the ExecPlan before implementation
3. create or update the OpenSpec change
4. present the OpenSpec artifacts for review and wait for a clear go-ahead
5. implement against those artifacts

## Escalation Rule

If there is uncertainty between tiers, choose the higher tier.

If a task grows during discovery, promote it and record the promotion in the planning artifacts.

## ExecPlan Standard

Use the `execplan` skill for Tier 1 and Tier 2 work.

ExecPlans should:
- be self-contained enough for a novice to execute
- explain the user-visible outcome
- include exact commands and validation steps
- remain living documents with current progress
- include an explicit review checkpoint when the change is Tier 1 or Tier 2

Store active ExecPlans in `docs/plans/`. When a plan is no longer active, move it to `docs/plans/completed/` when that archive structure is added.

## OpenSpec Standard

Use OpenSpec for Tier 2 work. OpenSpec is the formal artifact layer for changes that affect architecture, behavior, contracts, or cross-cutting concerns.

Start with:
- `openspec/project.md`
- the repo's checked-in OpenSpec workflows

## UI and UX Planning

For substantial UI or UX work, use the `frontend-design` skill before implementation.

This applies to:
- new pages
- dashboards
- major layout redesigns
- landing surfaces
- substantial interaction redesigns

The resulting plan should describe the intended visual direction, responsive behavior, accessibility expectations, and the one defining design motif.

## Documentation Expectations

For any implemented change:
- update `docs/CHANGELOG.md`
- keep `AGENTS.md` and `CLAUDE.md` aligned if root policy changed
- update `openspec/project.md` when repo-wide conventions change
- add or revise deeper docs only where they are the natural source of truth
