# 01. Product and Scope

## Проблема

AI CLI-агенты хорошо выполняют отдельные инженерные задачи, но быстро становятся неуправляемыми, если весь рабочий процесс держится только на длинной интерактивной сессии. Сложно:

- отслеживать состояние задачи;
- сохранять артефакты после каждого прогона;
- понимать, почему задача застряла;
- безопасно подключать человека;
- масштабировать одну и ту же схему на несколько репозиториев.

DELIVERATOR решает это через внутренний workflow engine с board-first моделью.

## Цель

Сделать self-hosted систему, которая:

- управляет задачами через внутреннюю доску;
- запускает AI CLI-агентов как детерминированные шаги;
- сохраняет evidence после каждого запуска;
- даёт человеку понятные точки контроля;
- поддерживает multi-project board;
- позволяет описывать процесс декларативно через `.deliverator/workflow.yml`.

## Кто пользователь

### Primary user

Технический лидер / CTO / staff engineer, который хочет управлять deliverability, а не сидеть в каждой агентной сессии.

### Secondary user

Разработчик, который подключается в режиме human review, правит worktree и возвращает задачу в автоматический цикл.

### Tertiary user

Платформенная команда, которая расширяет систему адаптерами, политиками и рецептами.

## Что входит в v1

- Внутренняя доска задач с проектами, фильтрами и swimlanes.
- Stageful workflow: Inbox → Discovery → Research → BuildTest → Feedback → Deploy → Done.
- Изолированный workspace на задачу.
- Git branch + PR per task.
- Запуск `claude -p` и `codex exec`.
- Run store с immutable evidence.
- Artifact viewer.
- Comments, attachments, approvals.
- Manual lease на workspace.
- Docker-based BuildTest runtime.
- Basic GitHub integration через `gh`.
- SQLite-based metadata store.
- REST API + SSE.

## Что не входит в v1

- Полноценный multi-tenant SaaS.
- Сложная RBAC-модель.
- Внешний tracker как source of truth.
- Полноценный Codex App Server driver.
- Kubernetes executor.
- Автоматический merge в protected branches без policy gate.
- “Верхнеуровневый LLM-оркестратор”, принимающий финальные решения вместо state machine.

## Главные метрики

### Delivery metrics

- lead time по задаче;
- time in stage;
- число циклов в BuildTest;
- число human feedback cycles;
- процент задач, дошедших до Done без ручной разработки.

### Reliability metrics

- число failed runs;
- число no-progress loop exits;
- число artifact collection failures;
- число reconcile repairs после рестарта.

### UX metrics

- среднее время до понимания “почему задача застряла”;
- среднее число кликов до просмотра ключевых артефактов;
- среднее время от human comment до следующего automated run.
