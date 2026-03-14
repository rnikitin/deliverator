# 09. Backend API

## Общий подход

В v1 отдельный BFF не нужен.
`deliveratord` сам является:

- workflow service;
- API server;
- artifact gateway;
- event streamer.

## API style

- REST для команд и чтения сущностей
- SSE для live updates

## Основные маршруты

### Projects

- `GET /api/projects`
- `GET /api/projects/:projectId`

### Board

- `GET /api/board`
- `GET /api/board/schema`
- `GET /api/board/filters`

### Tasks

- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId`
- `POST /api/tasks/:taskId/move`
- `POST /api/tasks/:taskId/lease/acquire`
- `POST /api/tasks/:taskId/lease/release`

### Comments and attachments

- `GET /api/tasks/:taskId/comments`
- `POST /api/tasks/:taskId/comments`
- `POST /api/tasks/:taskId/attachments`
- `GET /api/tasks/:taskId/attachments/:attachmentId`

### Runs

- `GET /api/tasks/:taskId/runs`
- `GET /api/runs/:runId`
- `GET /api/runs/:runId/logs`
- `POST /api/runs/:runId/cancel`
- `POST /api/tasks/:taskId/runs/retry`

### Artifacts

- `GET /api/tasks/:taskId/artifacts/current`
- `GET /api/runs/:runId/artifacts`
- `GET /api/artifacts/:artifactId`
- `GET /api/artifacts/:artifactId/content`

### Approvals

- `POST /api/tasks/:taskId/approvals`
- `GET /api/tasks/:taskId/approvals`

### Admin / health

- `GET /healthz`
- `GET /readyz`
- `GET /api/config/compiled`
- `GET /api/metrics`

## SSE streams

### `GET /api/events/stream`

События для всей борды:

- task.created
- task.updated
- task.moved
- run.started
- run.finished
- attention.changed

### `GET /api/tasks/:taskId/stream`

События по одной задаче:

- comment.added
- attachment.added
- approval.given
- artifact.indexed
- log.chunk
- run.status_changed

## Пример ответа `GET /api/board/schema`

```json
{
  "columns": [
    {"id": "inbox", "title": "Inbox"},
    {"id": "discovery", "title": "Discovery"},
    {"id": "research", "title": "Research"},
    {"id": "build_test", "title": "Build&Test"},
    {"id": "feedback", "title": "Feedback"},
    {"id": "deploy", "title": "Deploy"},
    {"id": "done", "title": "Done"}
  ],
  "filters": ["project", "stage", "attention_state", "priority", "has_pr"],
  "manual_moves": {
    "research": ["build_test"],
    "feedback": ["research", "deploy"]
  }
}
```

## Почему без GraphQL

GraphQL здесь не запрещён, но в v1 он не даёт большого выигрыша:

- доменная модель умеренно проста;
- набор экранов известен;
- SSE покрывает live needs;
- REST быстрее поднять и отлаживать.

## Auth

В локальном trusted deployment можно начать с простой session auth за reverse proxy.
В multi-user версии позже добавить полноценный authn/authz слой.
