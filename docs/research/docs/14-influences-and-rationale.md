# 14. Influences and Rationale

## Symphony — что берём

- long-running orchestration service;
- isolated implementation runs;
- repo-owned workflow contract;
- reconciler mindset;
- work management instead of agent babysitting.

## Symphony — что не берём в v1

- внешний tracker как source of truth;
- жёсткую привязку к одной reference implementation;
- полную зависимость от одного runtime path.

## agent-orchestrator — что берём

- plugin slot thinking;
- separation of runtime / agent / workspace / tracker / scm / notifier / terminal / lifecycle;
- emphasis on worktree-based execution.

## agent-orchestrator — что не берём в v1

- слишком широкую матрицу runtime/provider support сразу;
- terminal-centric experience как главное ядро продукта.

## OpenSpec — что берём

- artifacts as source of truth;
- spec-driven loop;
- flexible artifact workflow;
- ability to keep planning and implementation linked.

## OpenSpec — что не делаем

- не отдаём OpenSpec управление board transitions;
- не делаем DELIVERATOR зависимым от одного spec format.

## Claude Code ecosystem — что берём

- personal skills model;
- deterministic hooks for guardrails;
- CLI-first usage for local subscription-backed workflows.

## Codex ecosystem — что берём

- strong non-interactive execution story;
- path to deeper future integration through App Server.

## Итог

DELIVERATOR — не клон Symphony и не оболочка над agent-orchestrator.
Это отдельный продукт, который заимствует лучшие архитектурные идеи и подчиняет их одной цели: stageful delivery orchestration для CLI agents.
