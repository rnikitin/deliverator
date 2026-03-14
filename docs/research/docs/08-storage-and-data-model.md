# 08. Storage and Data Model

## Выбор v1

v1 использует:

- SQLite для metadata;
- filesystem для artifacts/evidence blobs.

Это даёт:

- простую установку;
- понятный backup;
- минимальный ops footprint.

## Таблицы SQLite

### projects

Метаданные проектов.

### tasks

Сущность карточки.

### task_events

Append-only журнал изменений задачи:

- created
- stage_moved
- comment_added
- attachment_added
- approval_given
- run_started
- run_finished
- lease_acquired
- lease_released

### workspaces

Текущий workspace и его lifecycle.

### pull_requests

Актуальное SCM-состояние.

### runs

Логические stage runs.

### action_runs

Подробные действия внутри runs.

### artifacts

Индекс artifacts и snapshots.

### comments

Человеческие и системные комментарии.

### attachments

Приложенные файлы.

### approvals

Одобрения gate’ов.

### leases

Manual lease records.

### reactions

Очередь или журнал реакций.

## Event sourcing — частично, не полностью

v1 не должен быть “чистым event-sourced продуктом”.
Но append-only `task_events` очень полезен для:

- audit;
- timeline UI;
- reconcile;
- future analytics.

Актуальное состояние можно хранить денормализованно в `tasks`, а `task_events` использовать как историю.

## Индексы

Обязательные индексы:

- `tasks(project_id, stage)`
- `tasks(attention_state)`
- `runs(task_id, started_at desc)`
- `artifacts(task_id, is_canonical)`
- `comments(task_id, created_at desc)`
- `approvals(task_id, stage, approved_at desc)`

## Blob storage layout

Blob store лежит в dataDir и хранит:

- task attachments
- run snapshots
- optional previews

В v1 достаточно обычного filesystem layout.
Если когда-то понадобится S3-compatible storage, это можно вынести за adapter.

## Migrations

Рекомендуется использовать обычные SQL migrations с idempotent startup runner.

## Backup policy

Минимум:

- nightly backup SQLite;
- periodic snapshot dataDir;
- ability to export a single task with all artifacts and logs.
