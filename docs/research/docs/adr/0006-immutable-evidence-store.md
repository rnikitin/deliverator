# ADR-0006: Immutable Evidence Store

## Status

Accepted

## Context

Если сохранять только текущий worktree, после cleanup теряется история исполнения.

## Decision

Каждый run сохраняет immutable evidence в отдельный run store.

## Consequences

Плюсы:

- audit trail;
- artifact history;
- post-mortem analysis;
- exportable task bundles.

Минусы:

- дополнительное место на диске;
- нужен retention policy.
