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
