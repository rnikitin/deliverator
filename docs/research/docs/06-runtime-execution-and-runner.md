# 06. Runtime, Execution, and Runner

## Принцип

Команды запускаются не из “сырого shell string”, а из **Invocation Bundle**.

Именно Invocation Bundle — единица воспроизводимости для action run.

## Invocation Bundle

Минимальная форма:

```json
{
  "task_id": "frontend-142",
  "run_id": "run_01HQ...",
  "action_run_id": "act_01HQ...",
  "stage": "research",
  "action_kind": "agent.run",
  "adapter": "claude_cli",
  "runtime": "local_process",
  "cwd": "/worktrees/frontend-142",
  "argv": ["claude", "-p", "..."],
  "env": {
    "DELIVERATOR_TASK_ID": "frontend-142"
  },
  "timeout_ms": 1800000,
  "expected_outputs": [
    "artifacts/current/execplan.md"
  ]
}
```

## Пайплайн исполнения

```text
Stage
  -> RecipeResolver
  -> ActionCompiler
  -> InvocationBundleBuilder
  -> RuntimeAdapter
  -> ProcessRunner
  -> StreamCapture
  -> ResultParser
  -> Validator
  -> ArtifactCollector
  -> action_result.json
```

## Как работает слой запуска команд

### 1. RecipeResolver

Резолвит recipe и подставляет выбранную реализацию.

### 2. ActionCompiler

Разворачивает recipe в конкретные actions.

### 3. InvocationBundleBuilder

Собирает:

- cwd;
- argv;
- env;
- timeout;
- mounts/paths;
- expected outputs;
- input snapshot refs.

### 4. RuntimeAdapter

Решает, где исполнять команду:

- `local_process`
- `docker_compose`
- `tmux`

### 5. ProcessRunner

Запускает subprocess, стримит stdout/stderr, отслеживает exit code, timeouts и cancellation.

### 6. ResultParser

Пытается вытащить structured output, если он задекларирован.

### 7. Validator

Проверяет declared outputs и структурные схемы.

### 8. ArtifactCollector

Собирает immutable evidence.

## Runtime adapters

### local_process

Используется для:

- Discovery
- Research
- Feedback
- лёгких проектных команд

Плюсы:

- просто реализовать;
- минимальная задержка;
- хорошо работает с локальными подписочными CLI.

### docker_compose

Используется для:

- BuildTest
- тестового окружения
- observability
- post-deploy команд в controlled env

Плюсы:

- изоляция;
- воспроизводимость;
- удобный dev runtime.

### tmux

Не обязателен для основного pipeline.
Нужен для operator/debug use-cases:

- live observation;
- ручной attach;
- удержание долгоживущих команд;
- форензика на зависших run’ах.

## CLI agent adapters

### Claude CLI adapter

Базовая стратегия:

- `claude -p`
- structured or semi-structured output
- materialized inputs через файлы и prompt templates
- опционально hooks/skills в project or user profile

### Codex CLI adapter

Базовая стратегия:

- `codex exec`
- JSON/JSONL events when needed
- optional structured output schema
- reuse of local CLI auth when available

## Почему не начинать с App Server и Agent SDK

Потому что v1 решает задачу через CLI-first модель и подписочные локальные сессии.
Для этого достаточны deterministic subprocess runs.

App Server и Agent SDK — хорошие опции для v2+, когда понадобятся:

- глубокая интерактивная интеграция;
- долгоживущие rich sessions;
- более тонкий event protocol.

## Cancellation model

Каждый run должен уметь:

- получить cancel;
- мягко завершиться;
- эскалировать до force kill;
- оставить понятное evidence, что произошло.

## Worker model

В v1 хватит одного process manager внутри `deliveratord` с bounded concurrency.
Отдельные remote workers можно добавить позже.
