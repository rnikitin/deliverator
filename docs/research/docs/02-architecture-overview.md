# 02. Architecture Overview

## Ключевая идея

DELIVERATOR строится как **long-running workflow service**.

Это не “умный чат”, который как-то сам живёт в терминале. Это процесс, который:

- хранит state machine;
- компилирует repo-owned workflow;
- запускает действия;
- индексирует evidence;
- показывает всё это в UI.

## Слои системы

```text
React UI
   │
   │ REST + SSE
   ▼
deliveratord
  ├─ Workflow compiler
  ├─ State machine / scheduler / reconcile loop
  ├─ Reaction engine
  ├─ Artifact indexer
  ├─ Run store + metadata DB
  ├─ Approval / comments / attachments service
  └─ Worker manager
        ├─ runtime.local_process
        ├─ runtime.docker_compose
        └─ runtime.tmux
              │
              ├─ claude -p
              ├─ codex exec
              ├─ git / gh
              ├─ openspec CLI
              └─ project commands
```

## Control plane vs execution plane

### Control plane

В control plane живут:

- projects;
- tasks;
- board state;
- stage transitions;
- approvals;
- comments and attachments;
- run scheduling;
- reactions to CI/review/manual events;
- artifact indexing.

### Execution plane

В execution plane живут:

- worktrees;
- docker-compose environments;
- CLI-runs;
- test processes;
- git operations;
- PR actions.

Control plane говорит **что** и **когда** запускать.
Execution plane отвечает **как именно** это исполняется.

## Почему без верхнеуровневого управляющего агента

Причины:

1. Детерминированность.  
   Переходы стадий, retries, approvals и cleanup должны определяться кодом, а не LLM.

2. Воспроизводимость.  
   Любой decision должен восстанавливаться из state, artifacts и logs.

3. Наблюдаемость.  
   В любой момент должно быть видно: что система думает, почему она это думает, какой следующий allowed transition.

4. Безопасность.  
   Protected actions лучше проверять в policy layer, а не делегировать их целиком модели.

Допустим только **advisor agent** без прав на мутацию state. Он может рекомендовать, но не решать.

## Технологический стек v1

### Backend

- Node.js 22
- TypeScript
- Fastify
- AJV
- Pino

### Frontend

- React
- Vite
- TypeScript
- TanStack Query
- Zustand или equivalent lightweight store

### Storage

- SQLite + WAL
- File-based blob store для artifacts/evidence

### Integrations

- `git`
- `gh`
- `docker compose`
- `claude`
- `codex`
- `openspec`

## Deployment model

v1 предполагает один self-hosted instance в trusted environment:

- один сервер/VM/desktop host;
- локальный filesystem;
- локальные worktrees;
- локальные CLI-auth sessions;
- опционально reverse proxy сверху.

Позже можно добавить Postgres, distributed workers и remote executors.
