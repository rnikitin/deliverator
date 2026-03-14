# ADR-0003: TypeScript + Fastify + React + SQLite

## Status

Accepted

## Context

Нужен быстрый путь к working orchestrator с shared types между backend и frontend и сильной интеграцией с filesystem/CLI tooling.

## Decision

В v1 использовать Node.js 22 + TypeScript + Fastify + React + SQLite.

## Consequences

Плюсы:

- высокая скорость разработки;
- единый type system;
- простой локальный deployment.

Минусы:

- не самый сильный стек для massive distributed concurrency;
- later может понадобиться Postgres и более сложный queue/runtime layer.
