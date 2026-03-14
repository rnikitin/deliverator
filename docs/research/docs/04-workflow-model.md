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
