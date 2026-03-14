# ADR-0005: Action / Recipe / Adapter Model

## Status

Accepted

## Context

Workflow должен быть гибким и не хардкодить конкретные steps вроде ExecPlan как встроенные фичи ядра.

## Decision

Разделить:

- stage
- action
- recipe
- adapter

## Consequences

Плюсы:

- гибкость;
- переиспользование;
- personalizable steps;
- легко добавлять новые backends.

Минусы:

- больше конфигурации;
- нужен хороший compiler и diagnostics.
