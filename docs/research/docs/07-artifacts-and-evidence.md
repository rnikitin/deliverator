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
