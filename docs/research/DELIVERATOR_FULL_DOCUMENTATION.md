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


---

# 01. Product and Scope

## Проблема

AI CLI-агенты хорошо выполняют отдельные инженерные задачи, но быстро становятся неуправляемыми, если весь рабочий процесс держится только на длинной интерактивной сессии. Сложно:

- отслеживать состояние задачи;
- сохранять артефакты после каждого прогона;
- понимать, почему задача застряла;
- безопасно подключать человека;
- масштабировать одну и ту же схему на несколько репозиториев.

DELIVERATOR решает это через внутренний workflow engine с board-first моделью.

## Цель

Сделать self-hosted систему, которая:

- управляет задачами через внутреннюю доску;
- запускает AI CLI-агентов как детерминированные шаги;
- сохраняет evidence после каждого запуска;
- даёт человеку понятные точки контроля;
- поддерживает multi-project board;
- позволяет описывать процесс декларативно через `.deliverator/workflow.yml`.

## Кто пользователь

### Primary user

Технический лидер / CTO / staff engineer, который хочет управлять deliverability, а не сидеть в каждой агентной сессии.

### Secondary user

Разработчик, который подключается в режиме human review, правит worktree и возвращает задачу в автоматический цикл.

### Tertiary user

Платформенная команда, которая расширяет систему адаптерами, политиками и рецептами.

## Что входит в v1

- Внутренняя доска задач с проектами, фильтрами и swimlanes.
- Stageful workflow: Inbox → Discovery → Research → BuildTest → Feedback → Deploy → Done.
- Изолированный workspace на задачу.
- Git branch + PR per task.
- Запуск `claude -p` и `codex exec`.
- Run store с immutable evidence.
- Artifact viewer.
- Comments, attachments, approvals.
- Manual lease на workspace.
- Docker-based BuildTest runtime.
- Basic GitHub integration через `gh`.
- SQLite-based metadata store.
- REST API + SSE.

## Что не входит в v1

- Полноценный multi-tenant SaaS.
- Сложная RBAC-модель.
- Внешний tracker как source of truth.
- Полноценный Codex App Server driver.
- Kubernetes executor.
- Автоматический merge в protected branches без policy gate.
- “Верхнеуровневый LLM-оркестратор”, принимающий финальные решения вместо state machine.

## Главные метрики

### Delivery metrics

- lead time по задаче;
- time in stage;
- число циклов в BuildTest;
- число human feedback cycles;
- процент задач, дошедших до Done без ручной разработки.

### Reliability metrics

- число failed runs;
- число no-progress loop exits;
- число artifact collection failures;
- число reconcile repairs после рестарта.

### UX metrics

- среднее время до понимания “почему задача застряла”;
- среднее число кликов до просмотра ключевых артефактов;
- среднее время от human comment до следующего automated run.


---

# 02. Architecture Overview

## Ключевая идея

DELIVERATOR строится как **long-running workflow service**.

Это не “умный чат”, который как-то сам живёт в терминале. Это процесс, который:

- хранит state machine;
- компилирует repo-owned workflow;
- запускает действия;
- индексирует evidence;
- показывает всё это в UI.

## Слои системы

```text
React UI
   │
   │ REST + SSE
   ▼
deliveratord
  ├─ Workflow compiler
  ├─ State machine / scheduler / reconcile loop
  ├─ Reaction engine
  ├─ Artifact indexer
  ├─ Run store + metadata DB
  ├─ Approval / comments / attachments service
  └─ Worker manager
        ├─ runtime.local_process
        ├─ runtime.docker_compose
        └─ runtime.tmux
              │
              ├─ claude -p
              ├─ codex exec
              ├─ git / gh
              ├─ openspec CLI
              └─ project commands
```

## Control plane vs execution plane

### Control plane

В control plane живут:

- projects;
- tasks;
- board state;
- stage transitions;
- approvals;
- comments and attachments;
- run scheduling;
- reactions to CI/review/manual events;
- artifact indexing.

### Execution plane

В execution plane живут:

- worktrees;
- docker-compose environments;
- CLI-runs;
- test processes;
- git operations;
- PR actions.

Control plane говорит **что** и **когда** запускать.
Execution plane отвечает **как именно** это исполняется.

## Почему без верхнеуровневого управляющего агента

Причины:

1. Детерминированность.  
   Переходы стадий, retries, approvals и cleanup должны определяться кодом, а не LLM.

2. Воспроизводимость.  
   Любой decision должен восстанавливаться из state, artifacts и logs.

3. Наблюдаемость.  
   В любой момент должно быть видно: что система думает, почему она это думает, какой следующий allowed transition.

4. Безопасность.  
   Protected actions лучше проверять в policy layer, а не делегировать их целиком модели.

Допустим только **advisor agent** без прав на мутацию state. Он может рекомендовать, но не решать.

## Технологический стек v1

### Backend

- Node.js 22
- TypeScript
- Fastify
- AJV
- Pino

### Frontend

- React
- Vite
- TypeScript
- TanStack Query
- Zustand или equivalent lightweight store

### Storage

- SQLite + WAL
- File-based blob store для artifacts/evidence

### Integrations

- `git`
- `gh`
- `docker compose`
- `claude`
- `codex`
- `openspec`

## Deployment model

v1 предполагает один self-hosted instance в trusted environment:

- один сервер/VM/desktop host;
- локальный filesystem;
- локальные worktrees;
- локальные CLI-auth sessions;
- опционально reverse proxy сверху.

Позже можно добавить Postgres, distributed workers и remote executors.


---

# 03. Domain Model

## Overview

DELIVERATOR оперирует небольшим числом первичных сущностей. Важно не раздувать доменную модель раньше времени.

## Project

Подключённый репозиторий.

Поля:

- `project_id`
- `name`
- `repo_path`
- `default_branch`
- `workflow_path`
- `deliverator_md_path`
- `enabled`
- `swimlane`
- `scm_provider`

## Task

Карточка на доске.

Поля:

- `task_id`
- `project_id`
- `title`
- `description`
- `stage`
- `attention_state`
- `priority`
- `status`
- `created_by`
- `created_at`
- `updated_at`
- `current_workspace_id`
- `current_branch`
- `current_pr_number`
- `manual_lease_state`

## Stage

Human-visible колонка борды.

В v1:

- `inbox`
- `discovery`
- `research`
- `build_test`
- `feedback`
- `deploy`
- `done`

## Attention state

Второе измерение поверх stage.

В v1:

- `actively_working`
- `awaiting_human_input`
- `awaiting_human_approval`
- `blocked`
- `ready_for_feedback`
- `ready_to_archive`
- `paused_for_human`

## Workspace

Изолированная рабочая директория задачи.

Поля:

- `workspace_id`
- `task_id`
- `project_id`
- `kind` (`worktree` initially)
- `path`
- `base_branch`
- `feature_branch`
- `head_sha`
- `status`

## Pull request

Связанный SCM-объект.

Поля:

- `provider`
- `repo`
- `number`
- `url`
- `state`
- `mergeable_state`
- `head_sha`
- `base_branch`

## Run

Логическая единица выполнения стадии или ручного цикла.

Поля:

- `run_id`
- `task_id`
- `stage`
- `trigger`
- `started_at`
- `ended_at`
- `status`
- `decision`
- `runtime_adapter`
- `agent_adapter`
- `recipe_ids`

## ActionRun

Конкретное действие внутри run.

Поля:

- `action_run_id`
- `run_id`
- `action_id`
- `action_kind`
- `recipe_id`
- `attempt`
- `status`
- `exit_code`
- `started_at`
- `ended_at`
- `structured_output_ref`

## Artifact

Индексируемый результат исполнения.

Поля:

- `artifact_id`
- `task_id`
- `run_id`
- `action_run_id`
- `kind`
- `logical_path`
- `snapshot_path`
- `mime_type`
- `size_bytes`
- `sha256`
- `is_canonical`

## Comment

Человеческий или системный комментарий, привязанный к задаче.

Поля:

- `comment_id`
- `task_id`
- `author_type`
- `author_id`
- `body`
- `created_at`
- `source`
- `applies_to_stage`

## Attachment

Файл, приложенный к задаче или комментарию.

Поля:

- `attachment_id`
- `task_id`
- `comment_id`
- `original_name`
- `content_type`
- `blob_path`
- `sha256`

## Approval

Факт человеческого одобрения gate.

Поля:

- `approval_id`
- `task_id`
- `stage`
- `gate_kind`
- `approved_by`
- `approved_at`
- `decision`
- `note`

## Manual lease

Сигнал, что workspace временно удерживается человеком.

Поля:

- `lease_id`
- `task_id`
- `acquired_by`
- `acquired_at`
- `released_at`
- `reason`

## Reaction

Системное событие, которое может вызвать новый run.

Примеры:

- `comment_added`
- `attachment_added`
- `approval_given`
- `ci_failed`
- `ci_passed`
- `pr_review_comment_added`
- `manual_move_requested`


---

# 04. Workflow Model

## Принцип

Workflow описывается декларативно. Ядро DELIVERATOR не знает про смысл “ExecPlan”, “OpenSpec”, “code simplify” или “review fix”.
Ядро знает только:

- есть stage;
- внутри stage есть actions и recipes;
- есть gates;
- есть transitions;
- есть loop policy;
- есть validators;
- есть declared artifacts.

## Видимые стадии

### 0. Inbox

Только человек:

- формирует описание;
- добавляет контекст;
- прикладывает файлы;
- двигает задачу в Discovery вручную.

### 1. Discovery

Автоматическое + ручное:

- создать worktree;
- создать branch;
- создать PR;
- исследовать кодовую базу и интернет;
- сформировать список вопросов;
- ждать ответов человека;
- вручную перевести в Research.

### 2. Research

Автоматическое + ручное:

- построить ExecPlan;
- построить OpenSpec artifacts;
- показать артефакты во viewer;
- обработать человеческие комментарии по тем же артефактам;
- коммитнуть и пушнуть изменения;
- вручную перейти в BuildTest.

### 3. BuildTest

Автоматическая циклическая стадия:

- поднять dev environment;
- поднять observability;
- брать open items из OpenSpec;
- реализовывать решение;
- писать и чинить тесты;
- выполнять review/fix;
- выполнять simplify x2;
- повторять цикл, пока в OpenSpec есть незакрытые задачи или validation bundle не зелёный;
- коммитить и пушить;
- автоматически перевести задачу в Feedback.

### 4. Feedback

Гибридная стадия:

- человек пишет комментарии или прикладывает новые скриншоты;
- агент применяет обратную связь в том же workspace;
- если feedback меняет смысл спеки, человек может вернуть задачу в Research;
- если всё ок, человек переводит задачу в Deploy;
- после каждого feedback cycle агент коммитит и пушит изменения.

### 5. Deploy

Гибридная стадия:

- rebase/merge with main;
- попытка авто-фикса конфликтов;
- merge PR;
- post-deploy команды;
- закрытие PR, если политика проекта так устроена;
- ожидание архивирования человеком;
- cleanup worktree and branch;
- переход в Done.

### 6. Done

Terminal state.

## Gates

### Gate types

- `await_human_input`
- `await_human_approval`
- `await_archive`
- `await_manual_transition`

### Почему gate — это не отдельная колонка

Gate — это состояние ожидания внутри стадии, а не обязательно отдельная колонка. Иначе борда быстро раздувается и перестаёт быть читаемой.

Поэтому UI должен показывать:

- stage;
- attention state;
- gate details.

## Loop semantics

### BuildTest loop

Цикл продолжается, пока одновременно не выполнены условия:

- `openspec.no_open_items == true`
- `tests.unit == pass`
- `tests.integration == pass`
- `tests.e2e == pass` или есть явный waiver
- `review.no_blockers == true`
- `runtime.dev_boot == pass`

### Защита от зависания

Workflow должен уметь задавать:

- `max_iterations`
- `max_no_progress_iterations`
- `max_same_open_items_repeats`
- `max_review_fix_cycles`

Если лимиты превышены, задача переводится в `blocked` или `awaiting_human_input`.

## Manual moves

Человек может переводить карточку только по разрешённым переходам.
Например:

- `Inbox -> Discovery`
- `Discovery -> Research`
- `Research -> BuildTest`
- `Feedback -> Research`
- `Feedback -> Deploy`

Эти allowed moves — часть compiled workflow schema, которую backend отдаёт UI.


---

# 05. Action / Recipe / Adapter Model

## Зачем нужна эта тройка

Чтобы workflow был гибким, нужно жёстко разделить:

- **что** надо сделать;
- **как** это делается;
- **где** это используется.

Без этого система либо hardcode’ит весь процесс, либо превращается в мешанину shell-скриптов.

## Action

Action — атомарная или почти атомарная операция.

Примеры:

- `workspace.ensure`
- `scm.branch.ensure`
- `scm.pr.ensure`
- `agent.run`
- `tests.unit.run`
- `tests.integration.run`
- `tests.e2e.run`
- `scm.rebase_on_main`
- `workspace.cleanup`

Action определяет контракт входов, выходов и ожидаемого результата.

## Recipe

Recipe — переиспользуемая декларативная сборка из actions, validators и policies.

Примеры:

- `discovery.questions`
- `research.execplan`
- `research.openspec`
- `build.loop`
- `feedback.apply`
- `deploy.finalize`

Recipe может:

- запускать один action;
- запускать последовательность actions;
- описывать loop;
- описывать outputs и validators;
- разрешать personal resolution.

## Adapter

Adapter — конкретная реализация action через backend/tool.

Примеры:

- `claude_cli`
- `codex_cli`
- `git_worktree`
- `github_cli`
- `docker_compose`
- `openspec_cli`
- `project_commands`
- `builtin`

## Пример: ExecPlan

ExecPlan не встроен в ядро.
Он оформляется как recipe.

```yaml
recipe_id: research.execplan
kind: artifact_recipe
resolver:
  mode: personalizable
  candidates:
    - repo://recipes/research.execplan.yml
    - profile://recipes/research.execplan.yml

actions:
  - kind: agent.run
    uses: claude_cli
    with:
      skill_ref: profile://execplan/default
      system_prompt_file: .deliverator/prompts/research/execplan.system.md
inputs:
  - task.description
  - task.comments.stage
  - task.attachments
  - repo.context
outputs:
  - artifacts/current/execplan.md
validators:
  - execplan_contract_v1
```

## Portable vs personalizable recipes

### Portable

Полностью определены в репозитории. Предсказуемы на любой машине.

### Personalizable

Workflow объявляет intent и contract, а конкретная реализация может резолвиться из user profile.

Это подходит для твоего личного ExecPlan step.

## Resolution order

Рекомендуемый порядок:

1. `.deliverator/recipes/<name>.yml` в репозитории
2. `~/.deliverator/profile.yml` + локальные recipe/skill paths
3. shared registry, если позже появится

## Почему это важно

Такой подход позволяет:

- менять модель или CLI без переписывания stage semantics;
- переиспользовать recipes в разных проектах;
- держать personal steps без ломания воспроизводимости;
- сохранять audit trail: какой именно recipe был зарезолвен и исполнен.


---

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


---

# 07. Artifacts and Evidence

## Основное разделение

DELIVERATOR хранит два разных мира:

### Mutable workspace

Это живая рабочая директория задачи:

- код;
- ветка;
- текущий OpenSpec;
- текущий ExecPlan;
- текущие отчёты.

### Immutable evidence

Это снимки и логи после каждого запуска:

- stdout/stderr;
- events;
- structured outputs;
- snapshots артефактов;
- diffs;
- git state before/after.

## Почему это важно

Когда задача закрыта и worktree удалён, evidence должно остаться.
Иначе невозможно:

- понять, что сделал агент;
- воспроизвести причину ошибки;
- просмотреть историю решений;
- строить аудит и аналитику.

## Canonical vs snapshot artifacts

### Canonical artifacts

Текущая версия артефакта внутри workspace, например:

- `artifacts/current/execplan.md`
- `artifacts/current/open_spec.md`
- `artifacts/current/build_report.md`

### Snapshot artifacts

Снимок канонического файла после конкретного run:

- `.../runs/<run-id>/artifacts/execplan.md`

## Run store layout

```text
~/.deliverator/data/
  tasks/<task-id>/
    runs/<run-id>/
      run_manifest.json
      invocation_bundle.json
      input_snapshot.json
      stdout.log
      stderr.log
      events.jsonl
      action_results/
        <action-run-id>.json
      artifacts/
        execplan.md
        open_spec.md
        build_report.md
        screenshots/...
      git_before.json
      git_after.json
      changed_files.json
```

## Artifact collector

После каждого action run collector делает:

1. снимает pre-state;
2. собирает declared outputs;
3. индексирует changed files;
4. определяет canonical artifacts;
5. копирует snapshots в run store;
6. считает sha256;
7. пишет manifest;
8. обновляет metadata DB.

## Что считается артефактом

Не только markdown-файлы.

Типы:

- markdown docs
- JSON structured outputs
- screenshots
- videos
- logs
- test reports
- diff summaries
- PR review exports
- environment manifests

## Stage result vs action result

### action_result.json

Результат конкретного действия.

Поля:

- `status`
- `decision`
- `summary`
- `structured_output`
- `artifacts`
- `validator_results`

### stage_result.json

Сводный результат стадии.

Поля:

- `decision`
- `next_stage`
- `human_gate_required`
- `blocking_reasons`
- `artifact_refs`
- `metrics`

## Viewer tabs

Task detail page должна уметь показывать:

- Overview
- Current artifacts
- Run history
- Logs
- Structured outputs
- Comments
- Attachments
- Approvals
- Git/PR status

## Attachments and human feedback

Комментарии и файлы человека тоже materialize’ятся в workspace как вход в следующий run.

Например:

- `artifacts/current/human_feedback.md`
- `artifacts/current/comments.jsonl`
- `artifacts/current/attachments/<file>`
- `artifacts/current/feedback_delta.md`


---

# 08. Storage and Data Model

## Выбор v1

v1 использует:

- SQLite для metadata;
- filesystem для artifacts/evidence blobs.

Это даёт:

- простую установку;
- понятный backup;
- минимальный ops footprint.

## Таблицы SQLite

### projects

Метаданные проектов.

### tasks

Сущность карточки.

### task_events

Append-only журнал изменений задачи:

- created
- stage_moved
- comment_added
- attachment_added
- approval_given
- run_started
- run_finished
- lease_acquired
- lease_released

### workspaces

Текущий workspace и его lifecycle.

### pull_requests

Актуальное SCM-состояние.

### runs

Логические stage runs.

### action_runs

Подробные действия внутри runs.

### artifacts

Индекс artifacts и snapshots.

### comments

Человеческие и системные комментарии.

### attachments

Приложенные файлы.

### approvals

Одобрения gate’ов.

### leases

Manual lease records.

### reactions

Очередь или журнал реакций.

## Event sourcing — частично, не полностью

v1 не должен быть “чистым event-sourced продуктом”.
Но append-only `task_events` очень полезен для:

- audit;
- timeline UI;
- reconcile;
- future analytics.

Актуальное состояние можно хранить денормализованно в `tasks`, а `task_events` использовать как историю.

## Индексы

Обязательные индексы:

- `tasks(project_id, stage)`
- `tasks(attention_state)`
- `runs(task_id, started_at desc)`
- `artifacts(task_id, is_canonical)`
- `comments(task_id, created_at desc)`
- `approvals(task_id, stage, approved_at desc)`

## Blob storage layout

Blob store лежит в dataDir и хранит:

- task attachments
- run snapshots
- optional previews

В v1 достаточно обычного filesystem layout.
Если когда-то понадобится S3-compatible storage, это можно вынести за adapter.

## Migrations

Рекомендуется использовать обычные SQL migrations с idempotent startup runner.

## Backup policy

Минимум:

- nightly backup SQLite;
- periodic snapshot dataDir;
- ability to export a single task with all artifacts and logs.


---

# 09. Backend API

## Общий подход

В v1 отдельный BFF не нужен.
`deliveratord` сам является:

- workflow service;
- API server;
- artifact gateway;
- event streamer.

## API style

- REST для команд и чтения сущностей
- SSE для live updates

## Основные маршруты

### Projects

- `GET /api/projects`
- `GET /api/projects/:projectId`

### Board

- `GET /api/board`
- `GET /api/board/schema`
- `GET /api/board/filters`

### Tasks

- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId`
- `POST /api/tasks/:taskId/move`
- `POST /api/tasks/:taskId/lease/acquire`
- `POST /api/tasks/:taskId/lease/release`

### Comments and attachments

- `GET /api/tasks/:taskId/comments`
- `POST /api/tasks/:taskId/comments`
- `POST /api/tasks/:taskId/attachments`
- `GET /api/tasks/:taskId/attachments/:attachmentId`

### Runs

- `GET /api/tasks/:taskId/runs`
- `GET /api/runs/:runId`
- `GET /api/runs/:runId/logs`
- `POST /api/runs/:runId/cancel`
- `POST /api/tasks/:taskId/runs/retry`

### Artifacts

- `GET /api/tasks/:taskId/artifacts/current`
- `GET /api/runs/:runId/artifacts`
- `GET /api/artifacts/:artifactId`
- `GET /api/artifacts/:artifactId/content`

### Approvals

- `POST /api/tasks/:taskId/approvals`
- `GET /api/tasks/:taskId/approvals`

### Admin / health

- `GET /healthz`
- `GET /readyz`
- `GET /api/config/compiled`
- `GET /api/metrics`

## SSE streams

### `GET /api/events/stream`

События для всей борды:

- task.created
- task.updated
- task.moved
- run.started
- run.finished
- attention.changed

### `GET /api/tasks/:taskId/stream`

События по одной задаче:

- comment.added
- attachment.added
- approval.given
- artifact.indexed
- log.chunk
- run.status_changed

## Пример ответа `GET /api/board/schema`

```json
{
  "columns": [
    {"id": "inbox", "title": "Inbox"},
    {"id": "discovery", "title": "Discovery"},
    {"id": "research", "title": "Research"},
    {"id": "build_test", "title": "Build&Test"},
    {"id": "feedback", "title": "Feedback"},
    {"id": "deploy", "title": "Deploy"},
    {"id": "done", "title": "Done"}
  ],
  "filters": ["project", "stage", "attention_state", "priority", "has_pr"],
  "manual_moves": {
    "research": ["build_test"],
    "feedback": ["research", "deploy"]
  }
}
```

## Почему без GraphQL

GraphQL здесь не запрещён, но в v1 он не даёт большого выигрыша:

- доменная модель умеренно проста;
- набор экранов известен;
- SSE покрывает live needs;
- REST быстрее поднять и отлаживать.

## Auth

В локальном trusted deployment можно начать с простой session auth за reverse proxy.
В multi-user версии позже добавить полноценный authn/authz слой.


---

# 10. Frontend and UX

## Главная цель UI

Не “управлять агентом в терминале”, а быстро отвечать на вопросы:

- на какой стадии задача;
- что она сейчас делает;
- что уже было сделано;
- что ждёт от человека;
- какие артефакты были произведены;
- почему задача застряла;
- как отправить её дальше.

## Основные экраны

### 1. Global Board

Колонки стадий, swimlanes по проектам, фильтры.

Обязательные фильтры:

- project
- stage
- attention_state
- priority
- has_pr
- requires_human

### 2. Task Detail

Вкладки:

- Summary
- Current Artifacts
- Runs
- Logs
- Comments
- Attachments
- Approvals
- Git / PR

### 3. Artifact Viewer

Поддержка:

- markdown
- images
- JSON
- plain logs
- side-by-side diff summary

### 4. Project Settings

Показывает:

- путь к репозиторию;
- workflow status;
- adapter bindings;
- health checks.

### 5. Admin / Runtime View

Показывает:

- current workers;
- queued reactions;
- running tasks;
- failed runs;
- reconcile actions.

## Нужен ли отдельный BFF

Нет, в v1 не нужен.

Причины:

- backend уже знает всю доменную модель;
- board schema компилируется там же;
- artifact access и run logs всё равно должны идти от orchestrator;
- отдельный BFF добавил бы только дублирование.

## UX паттерны

### Stage vs attention

UI должен показывать и stage, и attention_state.
Например задача может быть в `research`, но при этом `awaiting_human_approval`.

### Manual actions

На карточке показывать только разрешённые действия:

- move to next stage
- send back to research
- approve
- retry run
- acquire manual lease

### Human feedback

Комментарии и attachments должны быть first-class элементами UI, а не hidden metadata.
После добавления комментария пользователь должен сразу видеть, какой reaction это запустит.

### Run inspection

Нужно быстро видеть:

- recipe / adapter / model
- start/end time
- decision
- artifacts produced
- validator failures
- last 200 lines logs

## MVP UI

Для v1 достаточно:

- board
- task details
- artifact viewer
- run log viewer
- comment form
- move/approve buttons

Полноценный web terminal можно отложить.


---

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


---

# 12. MVP and Build Order

## Что считается MVP

MVP DELIVERATOR умеет:

- подключать несколько локальных проектов;
- показывать общую борду;
- создавать задачи;
- двигать задачу по базовым стадиям;
- создавать worktree + branch + PR;
- запускать Discovery / Research / BuildTest / Feedback / Deploy steps;
- работать с `claude -p` и `codex exec`;
- сохранять run evidence;
- показывать артефакты и логи;
- поддерживать human comments, approvals и manual moves.

## Порядок реализации

### Phase 1 — Core types and workflow compiler

Сделать:

- доменные типы;
- parser + validator для `.deliverator/workflow.yml`;
- compiled workflow schema;
- stage transition rules.

### Phase 2 — Persistence and project registry

Сделать:

- SQLite schema;
- migrations;
- project registry;
- tasks CRUD;
- task events journal.

### Phase 3 — Workspace and SCM basics

Сделать:

- git worktree manager;
- branch ensure;
- PR ensure через `gh`;
- workspace state sync.

### Phase 4 — Runner

Сделать:

- action runner;
- invocation bundle;
- local_process runtime;
- stdout/stderr capture;
- timeouts;
- cancellation.

### Phase 5 — Agent adapters

Сделать:

- `claude_cli` adapter;
- `codex_cli` adapter;
- structured output capture;
- basic validators.

### Phase 6 — Evidence store and artifact indexer

Сделать:

- run store layout;
- artifact collector;
- canonical vs snapshot artifacts;
- artifact metadata DB.

### Phase 7 — API and board UI

Сделать:

- REST API;
- SSE;
- board view;
- task detail page;
- log viewer;
- artifact viewer.

### Phase 8 — BuildTest loop

Сделать:

- loop controller;
- no-progress detection;
- openspec integration points;
- test bundle runner.

### Phase 9 — Docker runtime

Сделать:

- `docker_compose` runtime;
- dev env bootstrap;
- observability integration hooks.

### Phase 10 — Feedback and Deploy

Сделать:

- comments/attachments to workspace materialization;
- approvals;
- deploy actions;
- archive and cleanup flows.

## Что писать первым буквально

Если нужно совсем приземлённо, стартовый coding order такой:

1. `packages/core` — types + workflow compiler
2. `packages/db` — schema + repos
3. `packages/adapters/workspace-git-worktree`
4. `packages/runner`
5. `packages/adapters/agent-claude-cli`
6. `packages/adapters/agent-codex-cli`
7. `apps/server`
8. `apps/web`
9. `packages/artifacts`
10. `packages/adapters/runtime-docker-compose`


---

# 13. Roadmap

## v1.0

- Internal board
- Multi-project support
- Repo-owned workflow
- Recipes
- Claude/Codex CLI adapters
- Worktree + PR flow
- Artifact viewer
- BuildTest loop
- Feedback and Deploy flows

## v1.1

- Better OpenSpec adapter
- CI webhooks / reactions
- richer test/report tabs
- export task bundle
- notifications

## v1.2

- Codex App Server driver
- better structured run telemetry
- operator tmux runtime view
- task templates
- policy packs

## v1.3

- External tracker integration
- GitLab support
- webhook-based SCM sync
- multi-user auth

## v1.4

- Postgres backend
- remote workers
- queue abstraction
- distributed runtimes

## v1.5

- optional advisor agent
- recommendation engine for stuck tasks
- automated classification of human comments
- richer analytics and stage throughput dashboards


---

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


---

# 15. Suggested Codebase Layout

```text
/apps
  /server
  /web
  /cli

/packages
  /core
  /db
  /runner
  /artifacts
  /contracts
  /shared
  /adapters
    /agent-claude-cli
    /agent-codex-cli
    /workspace-git-worktree
    /runtime-local-process
    /runtime-docker-compose
    /runtime-tmux
    /scm-github
    /openspec-cli
    /project-commands
```

## apps/server

`deliveratord`:

- API
- scheduler
- reconcile loop
- worker manager
- artifact indexing trigger

## apps/web

React application:

- board
- task details
- artifact viewer
- run history
- approvals

## apps/cli

Операторские команды:

- `deliverator project add`
- `deliverator doctor`
- `deliverator export-task`
- `deliverator reindex`
- `deliverator retry-run`

## packages/core

- types
- workflow compiler
- state machine
- policies
- attention-state rules

## packages/db

- migrations
- repositories
- query helpers

## packages/runner

- action execution
- invocation bundle builder
- cancellation
- stream capture
- validators glue

## packages/artifacts

- collector
- blob store
- preview helpers
- canonical artifact resolver

## packages/contracts

- JSON Schemas
- TS types generated from schemas if desired

## packages/adapters/*

Изолированные реализации backends.


---

# 16. Interface Sketches

## Core types

```ts
export type StageId =
  | "inbox"
  | "discovery"
  | "research"
  | "build_test"
  | "feedback"
  | "deploy"
  | "done";

export type AttentionState =
  | "actively_working"
  | "awaiting_human_input"
  | "awaiting_human_approval"
  | "blocked"
  | "ready_for_feedback"
  | "ready_to_archive"
  | "paused_for_human";
```

## Workflow compiler

```ts
export interface CompiledWorkflow {
  workflowId: string;
  columns: CompiledColumn[];
  stages: Record<StageId, CompiledStage>;
  filters: string[];
}

export interface CompiledStage {
  id: StageId;
  title: string;
  mode: "manual" | "hybrid" | "automated" | "terminal";
  entryActions: CompiledActionRef[];
  actions: CompiledActionRef[];
  loop?: CompiledLoop;
  gates: CompiledGate[];
  exitActions: CompiledActionRef[];
  allowedManualMovesTo: StageId[];
}
```

## Adapter interfaces

```ts
export interface RuntimeAdapter {
  kind: string;
  execute(bundle: InvocationBundle): Promise<ProcessHandle>;
  cancel(handle: ProcessHandle): Promise<void>;
}

export interface AgentAdapter {
  kind: string;
  compile(input: AgentActionInput): Promise<InvocationBundle>;
  parseResult(run: ProcessCompletedEvent): Promise<ActionResult>;
}

export interface WorkspaceAdapter {
  ensureWorkspace(input: EnsureWorkspaceInput): Promise<WorkspaceState>;
  cleanupWorkspace(input: CleanupWorkspaceInput): Promise<void>;
}

export interface ScmAdapter {
  ensureBranch(input: EnsureBranchInput): Promise<ScmBranchState>;
  ensurePullRequest(input: EnsurePrInput): Promise<PullRequestState>;
  mergePullRequest(input: MergePrInput): Promise<MergeResult>;
}
```

## Runner interfaces

```ts
export interface InvocationBundle {
  taskId: string;
  runId: string;
  actionRunId: string;
  stage: StageId;
  actionKind: string;
  adapter: string;
  runtime: string;
  cwd: string;
  argv: string[];
  env: Record<string, string>;
  timeoutMs: number;
  expectedOutputs: DeclaredOutput[];
}

export interface ActionResult {
  status:
    | "success"
    | "failed_retryable"
    | "failed_terminal"
    | "blocked"
    | "cancelled";
  decision:
    | "continue"
    | "repeat"
    | "human_handoff"
    | "blocked"
    | "advance"
    | "stop";
  summary: string;
  artifacts: string[];
  structuredOutput?: unknown;
  validatorResults?: ValidatorResult[];
}
```

## Artifact collector

```ts
export interface ArtifactCollector {
  collect(input: CollectArtifactsInput): Promise<CollectedArtifact[]>;
  markCanonical(input: MarkCanonicalInput): Promise<void>;
}
```

## State machine service

```ts
export interface TaskStateService {
  moveTask(input: MoveTaskInput): Promise<TaskState>;
  applyReaction(input: ReactionEvent): Promise<void>;
  startRun(input: StartRunInput): Promise<RunState>;
  finalizeRun(input: FinalizeRunInput): Promise<RunState>;
}
```


---

# 17. Sample Task Sequence

## Сценарий: задача проходит путь Inbox → Done

### 1. Пользователь создаёт задачу

- выбирает проект;
- пишет описание;
- добавляет screenshots и входные файлы;
- задача появляется в `Inbox`.

### 2. Пользователь двигает задачу в Discovery

Backend:

- валидирует allowed move;
- создаёт task event;
- scheduler ставит `discovery` run.

### 3. Discovery run

Действия:

- `workspace.ensure`
- `scm.branch.ensure`
- `scm.pr.ensure`
- `recipe.discovery.questions`

Результат:

- создан worktree;
- создан branch;
- создан PR;
- создан `artifacts/current/discovery_questions.md`;
- attention_state = `awaiting_human_input`.

### 4. Пользователь отвечает на вопросы

UI materialize’ит ответы в:

- comment thread;
- `discovery_answers.md` при следующем run.

После ответа человек двигает задачу в `Research`.

### 5. Research run

Действия:

- `recipe.research.execplan`
- `recipe.research.openspec`

Результат:

- `artifacts/current/execplan.md`
- `openspec/...`
- коммит и push
- attention_state = `awaiting_human_approval`

### 6. Человек комментирует Research

Если есть замечания:

- создаётся reaction `comment_added`;
- orchestrator запускает revise-cycle внутри `Research`;
- артефакты обновляются;
- коммит и push повторяются.

Когда всё хорошо, человек переводит задачу в `BuildTest`.

### 7. BuildTest loop

Оркестратор:

- поднимает dev env и observability;
- читает open items из OpenSpec;
- запускает bounded implementation loop.

Loop итерация:

- implement next slice;
- add/fix tests;
- run unit/integration/e2e;
- review;
- review-fix;
- simplify x2;
- refresh OpenSpec status.

Когда completion conditions выполнены:

- коммит;
- push;
- автоматический move в `Feedback`.

### 8. Feedback

Человек:

- смотрит приложение;
- пишет комментарии;
- прикладывает новые screenshots.

Оркестратор:

- materialize feedback;
- запускает `recipe.feedback.apply`;
- коммитит;
- пушит.

Если feedback меняет специку — человек двигает задачу назад в `Research`.
Если всё хорошо — переводит в `Deploy`.

### 9. Deploy

Действия:

- rebase on main;
- conflict fix attempt;
- PR merge;
- post-deploy commands;
- deploy report.

После этого attention_state = `ready_to_archive`.

### 10. Архивирование и cleanup

Человек архивирует задачу.
Оркестратор:

- удаляет branch;
- удаляет worktree;
- сохраняет final state;
- переводит задачу в `Done`.

Evidence остаётся в data store.
