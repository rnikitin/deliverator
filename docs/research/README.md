# DELIVERATOR — Documentation Pack

Этот архив — стартовая документация для реализации **DELIVERATOR**: внутреннего оркестратора задач для AI CLI-агентов, ориентированного на stageful workflow, worktree-изоляцию, декларативные recipes и сильную трассировку артефактов.

## Что внутри

- `DELIVERATOR.md` — человекочитаемый repo contract.
- `.deliverator/workflow.yml` — пример машиночитаемого workflow.
- `.deliverator/recipes/` — примеры reusable recipes.
- `.deliverator/prompts/` — стартовые prompt templates.
- `.deliverator/schemas/` — JSON Schemas для ключевых контрактов.
- `config/` — примеры глобальных orchestrator-конфигов.
- `docs/` — архитектура, доменная модель, API, storage, UX, roadmap и ADR’ы.

## Рекомендуемый порядок чтения

1. `docs/01-product-and-scope.md`
2. `docs/02-architecture-overview.md`
3. `docs/04-workflow-model.md`
4. `docs/05-action-recipe-adapter-model.md`
5. `docs/06-runtime-execution-and-runner.md`
6. `docs/07-artifacts-and-evidence.md`
7. `docs/08-storage-and-data-model.md`
8. `docs/09-backend-api.md`
9. `docs/10-frontend-and-ux.md`
10. `docs/12-mvp-and-build-order.md`

## Короткая суть проекта

DELIVERATOR — это **workflow service**, а не “агент над агентами”.

Он:

- хранит внутреннюю канбан-доску по задачам;
- для каждой задачи создаёт изолированный workspace;
- запускает отдельные clean CLI-runs на каждой автоматической операции;
- индексирует артефакты и run evidence после каждого запуска;
- поддерживает human gates и ручные комментарии;
- показывает общий board по нескольким проектам со swimlanes и фильтрами.

Главный принцип: **workspace и artifacts важнее chat/session state**.

## Стартовый стек v1

- Backend: Node.js 22 + TypeScript + Fastify
- Frontend: React + Vite + TypeScript
- DB: SQLite (WAL)
- Live updates: SSE
- Process execution: `spawn`/`execa`
- SCM: `git` + `gh`
- Runtimes: `local_process`, `docker_compose`, `tmux` (debug/operator)
- Agents: `claude -p`, `codex exec`
