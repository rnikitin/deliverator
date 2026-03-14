# ADR-0004: No Separate BFF in v1

## Status

Accepted

## Context

Вопрос: нужен ли отдельный Backend-for-Frontend.

## Decision

Нет. `deliveratord` сам предоставляет API и SSE для UI.

## Consequences

Плюсы:

- меньше слоёв;
- меньше синхронизации между двумя бэкендами;
- быстрее MVP.

Минусы:

- если UI сильно усложнится, позже может потребоваться выделенный presentation layer.
