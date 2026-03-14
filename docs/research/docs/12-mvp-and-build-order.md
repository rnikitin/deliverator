# 12. MVP and Build Order

## Что считается MVP

MVP DELIVERATOR умеет:

- подключать несколько локальных проектов;
- показывать общую борду;
- создавать задачи;
- двигать задачу по базовым стадиям;
- создавать worktree + branch + PR;
- запускать Discovery / Research / BuildTest / Feedback / Deploy steps;
- работать с `claude -p` и `codex exec`;
- сохранять run evidence;
- показывать артефакты и логи;
- поддерживать human comments, approvals и manual moves.

## Порядок реализации

### Phase 1 — Core types and workflow compiler

Сделать:

- доменные типы;
- parser + validator для `.deliverator/workflow.yml`;
- compiled workflow schema;
- stage transition rules.

### Phase 2 — Persistence and project registry

Сделать:

- SQLite schema;
- migrations;
- project registry;
- tasks CRUD;
- task events journal.

### Phase 3 — Workspace and SCM basics

Сделать:

- git worktree manager;
- branch ensure;
- PR ensure через `gh`;
- workspace state sync.

### Phase 4 — Runner

Сделать:

- action runner;
- invocation bundle;
- local_process runtime;
- stdout/stderr capture;
- timeouts;
- cancellation.

### Phase 5 — Agent adapters

Сделать:

- `claude_cli` adapter;
- `codex_cli` adapter;
- structured output capture;
- basic validators.

### Phase 6 — Evidence store and artifact indexer

Сделать:

- run store layout;
- artifact collector;
- canonical vs snapshot artifacts;
- artifact metadata DB.

### Phase 7 — API and board UI

Сделать:

- REST API;
- SSE;
- board view;
- task detail page;
- log viewer;
- artifact viewer.

### Phase 8 — BuildTest loop

Сделать:

- loop controller;
- no-progress detection;
- openspec integration points;
- test bundle runner.

### Phase 9 — Docker runtime

Сделать:

- `docker_compose` runtime;
- dev env bootstrap;
- observability integration hooks.

### Phase 10 — Feedback and Deploy

Сделать:

- comments/attachments to workspace materialization;
- approvals;
- deploy actions;
- archive and cleanup flows.

## Что писать первым буквально

Если нужно совсем приземлённо, стартовый coding order такой:

1. `packages/core` — types + workflow compiler
2. `packages/db` — schema + repos
3. `packages/adapters/workspace-git-worktree`
4. `packages/runner`
5. `packages/adapters/agent-claude-cli`
6. `packages/adapters/agent-codex-cli`
7. `apps/server`
8. `apps/web`
9. `packages/artifacts`
10. `packages/adapters/runtime-docker-compose`
