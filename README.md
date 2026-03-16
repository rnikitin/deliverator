# DELIVERATOR

DELIVERATOR is a local-first workflow control surface for AI CLI agents.

It gives you:
- a project-scoped board for each registered codebase
- a global dashboard and feed across all projects
- deterministic workflow stages, approvals, and evidence
- portable local runtime without Docker

## Why DELIVERATOR

Most agent workflows fall apart in one of two ways:
- the workflow logic lives only in prompts and is hard to audit
- all runtime state is centralized in one service and does not travel with the project

DELIVERATOR takes the opposite approach:
- project workflow lives with the project in `.deliverator/shared`
- local working state lives beside the project in `.deliverator/local`
- global app state stays in `~/.deliverator`
- the operator gets one place to see what needs attention right now

## Core Model

Each registered project owns:
- `<project>/.deliverator/shared`
- `<project>/.deliverator/local`

`shared/` is for durable, versionable project workflow data:
- `workflow.yaml`
- `project.yaml`
- prompts, recipes, schemas, validators

`local/` is for uncommitted runtime state:
- `deliverator.db`
- logs
- artifacts
- worktrees

DELIVERATOR itself keeps global state under `~/.deliverator`:
- registry database
- current runtime metadata
- global logs

## Product Surfaces

- `Projects` registers and switches between managed projects.
- `Board` is project-scoped and shows only that project’s tasks.
- `Dashboard` is global and aggregates attention across projects.
- `Feed` is global and shows recent cross-project events.
- `Task detail` stays project-scoped and keeps task identity as `projectSlug + taskId`.

## Quick Start

From a checkout:

```bash
bun install
bun run start
```

In another shell:

```bash
bun run open
```

The same product commands are exposed through the `deliverator` CLI surface:
- `deliverator start`
- `deliverator open`
- `deliverator logs`

Today the repository uses `bun run ...` as the local entrypoint from source. Once packaged or installed globally, the same subcommands remain the product contract.

## Local Runtime

When the app starts:
- it creates or reuses `~/.deliverator`
- it opens the global registry database
- it serves the site and API from one Fastify process
- it picks a free local port by default
- it writes the current URL to `~/.deliverator/run/current.json`

Project registration creates the expected layout inside the target project path and updates the target `.gitignore` so `.deliverator/local/` stays uncommitted while `.deliverator/shared/` stays versionable.

## Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) for local setup, watch mode, validation, and troubleshooting
- [CONTRIBUTING.md](./CONTRIBUTING.md) for planning, contribution flow, and review expectations
- [ARCHITECTURE.md](./ARCHITECTURE.md) for the high-level codemap
- [docs/index.md](./docs/index.md) for the docs map
