# 11. Security, Ops, and Reliability

## Trusted environment assumption

v1 рассчитан на trusted environment.
Это не значит, что можно игнорировать безопасность.
Это значит, что можно начать без enterprise-grade multi-tenant hardening.

## Главные риски

- опасные shell-команды;
- merge в защищённую ветку;
- destructive migrations;
- несанкционированный deploy;
- утечка secrets в logs или artifacts;
- runaway loops;
- зависшие runtimes.

## Policy gates

Каждое чувствительное действие должно иметь policy check.

Примеры protected actions:

- `scm.pr.merge`
- `runtime.post_deploy_commands`
- `scm.branch.delete`
- `workspace.cleanup` после незавершённого review
- любые команды с destructive markers

## Secrets model

DELIVERATOR не должен сохранять секреты в workflow config.

Источники секретов:

- environment variables
- local credential stores
- CLI-managed auth sessions

В artifacts и logs секреты должны проходить через redaction layer.

## Reliability controls

### Retries

Retry только для safe/retryable failures:

- transient CLI failure
- network hiccup
- temporary GitHub API failure
- docker startup timeout

Не retry automatically:

- destructive failures
- policy denials
- repeated no-progress loops

### Reconcile loop

Фоновая сверка делает:

- обновление статуса running runs;
- проверку orphaned processes;
- подтяжку PR state;
- repair attention_state;
- recovery после рестарта.

### Heartbeats

Долгие run’ы должны эмитить heartbeats.
Если heartbeat пропал, run помечается suspect и проверяется reconcile loop.

## Logging

Минимум два уровня:

- структурированные server logs;
- per-run stdout/stderr/event logs.

## Cleanup

Cleanup не должен уничтожать evidence.
Удаляется workspace, но не run store.

## Backups

Минимум:

- SQLite backup;
- blob store snapshot;
- per-task export.

## Multi-user future

Позже понадобятся:

- authn/authz;
- audit policies;
- user roles;
- project-level permissions;
- protected operations approval rules.
