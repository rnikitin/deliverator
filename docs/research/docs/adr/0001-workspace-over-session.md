# ADR-0001: Workspace over Session

## Status

Accepted

## Context

Длинные agent-сессии плохо подходят как primary continuity layer.
Они трудны для восстановления, плохо аудируются и слишком зависят от состояния контекстного окна.

## Decision

Единица продолжения в DELIVERATOR — workspace задачи, а не чат-сессия модели.

## Consequences

Плюсы:

- воспроизводимость;
- более чистый artifact model;
- безопасный ручной takeover;
- понятный lifecycle worktree.

Минусы:

- больше явной materialization logic;
- больше файловых артефактов.
