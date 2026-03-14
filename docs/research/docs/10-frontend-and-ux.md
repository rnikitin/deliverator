# 10. Frontend and UX

## Главная цель UI

Не “управлять агентом в терминале”, а быстро отвечать на вопросы:

- на какой стадии задача;
- что она сейчас делает;
- что уже было сделано;
- что ждёт от человека;
- какие артефакты были произведены;
- почему задача застряла;
- как отправить её дальше.

## Основные экраны

### 1. Global Board

Колонки стадий, swimlanes по проектам, фильтры.

Обязательные фильтры:

- project
- stage
- attention_state
- priority
- has_pr
- requires_human

### 2. Task Detail

Вкладки:

- Summary
- Current Artifacts
- Runs
- Logs
- Comments
- Attachments
- Approvals
- Git / PR

### 3. Artifact Viewer

Поддержка:

- markdown
- images
- JSON
- plain logs
- side-by-side diff summary

### 4. Project Settings

Показывает:

- путь к репозиторию;
- workflow status;
- adapter bindings;
- health checks.

### 5. Admin / Runtime View

Показывает:

- current workers;
- queued reactions;
- running tasks;
- failed runs;
- reconcile actions.

## Нужен ли отдельный BFF

Нет, в v1 не нужен.

Причины:

- backend уже знает всю доменную модель;
- board schema компилируется там же;
- artifact access и run logs всё равно должны идти от orchestrator;
- отдельный BFF добавил бы только дублирование.

## UX паттерны

### Stage vs attention

UI должен показывать и stage, и attention_state.
Например задача может быть в `research`, но при этом `awaiting_human_approval`.

### Manual actions

На карточке показывать только разрешённые действия:

- move to next stage
- send back to research
- approve
- retry run
- acquire manual lease

### Human feedback

Комментарии и attachments должны быть first-class элементами UI, а не hidden metadata.
После добавления комментария пользователь должен сразу видеть, какой reaction это запустит.

### Run inspection

Нужно быстро видеть:

- recipe / adapter / model
- start/end time
- decision
- artifacts produced
- validator failures
- last 200 lines logs

## MVP UI

Для v1 достаточно:

- board
- task details
- artifact viewer
- run log viewer
- comment form
- move/approve buttons

Полноценный web terminal можно отложить.
