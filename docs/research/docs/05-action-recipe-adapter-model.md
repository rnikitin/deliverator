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
