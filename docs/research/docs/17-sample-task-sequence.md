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
