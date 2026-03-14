# ADR-0002: Deterministic Core, No Top-Level Agent

## Status

Accepted

## Context

Возникает соблазн сделать “агента над агентами”, который сам решает переходы стадий, повторы и завершение задачи.

## Decision

State machine, retries, approvals, transitions и policy gates реализуются кодом, а не LLM.

## Consequences

Плюсы:

- предсказуемость;
- auditability;
- безопасность;
- проще дебажить.

Минусы:

- меньше “магии”;
- часть умной маршрутизации придётся кодировать явно.
