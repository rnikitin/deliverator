# 15. Suggested Codebase Layout

```text
/apps
  /server
  /web
  /cli

/packages
  /core
  /db
  /runner
  /artifacts
  /contracts
  /shared
  /adapters
    /agent-claude-cli
    /agent-codex-cli
    /workspace-git-worktree
    /runtime-local-process
    /runtime-docker-compose
    /runtime-tmux
    /scm-github
    /openspec-cli
    /project-commands
```

## apps/server

`deliveratord`:

- API
- scheduler
- reconcile loop
- worker manager
- artifact indexing trigger

## apps/web

React application:

- board
- task details
- artifact viewer
- run history
- approvals

## apps/cli

Операторские команды:

- `deliverator project add`
- `deliverator doctor`
- `deliverator export-task`
- `deliverator reindex`
- `deliverator retry-run`

## packages/core

- types
- workflow compiler
- state machine
- policies
- attention-state rules

## packages/db

- migrations
- repositories
- query helpers

## packages/runner

- action execution
- invocation bundle builder
- cancellation
- stream capture
- validators glue

## packages/artifacts

- collector
- blob store
- preview helpers
- canonical artifact resolver

## packages/contracts

- JSON Schemas
- TS types generated from schemas if desired

## packages/adapters/*

Изолированные реализации backends.
