## ADDED Requirements

### Requirement: Board SHALL render 7 stage columns

The Board screen at `/` SHALL display a horizontal layout of 7 columns, one per workflow stage in order: Inbox, Discovery, Research, Build/Test, Feedback, Deploy, Done. Each column SHALL have a header showing the stage name in uppercase Chakra Petch with a 2px bottom border in the stage color, plus a task count badge.

#### Scenario: All 7 columns are visible on a wide viewport
- **WHEN** the user navigates to `/` on a viewport at least 1280px wide
- **THEN** 7 columns are visible: INBOX, DISCOVERY, RESEARCH, BUILD/TEST, FEEDBACK, DEPLOY, DONE
- **AND** each column header shows the number of tasks in that column

#### Scenario: Columns have minimum width and scroll horizontally
- **WHEN** the viewport is narrower than 1400px
- **THEN** each column maintains a minimum width of 200px
- **AND** the column container scrolls horizontally

### Requirement: Done column SHALL be collapsed by default

The Done column SHALL render in a collapsed state by default, showing only the column header with task count. The user SHALL be able to expand it to see individual cards.

#### Scenario: Done column starts collapsed
- **WHEN** the board loads
- **THEN** the Done column header is visible with a task count
- **AND** individual task cards in the Done column are not visible

#### Scenario: Done column can be expanded
- **WHEN** the user clicks the Done column header
- **THEN** the Done column expands to show individual task cards

### Requirement: Task cards SHALL display attention state and stage information

Each task card SHALL show: a 2px left border colored by the task's attention state, an attention state badge (uppercase Chakra Petch label with state color background), the task title, a stage dot with label, and a relative last-activity timestamp.

#### Scenario: Card shows attention state badge with correct color
- **WHEN** a task has attention state `blocked`
- **THEN** its card displays a "BLOCKED" badge with a red background
- **AND** the card has a 2px red left border

#### Scenario: Card shows last activity as relative time
- **WHEN** a task's last activity was 3 minutes ago
- **THEN** the card displays "3m ago" as the last activity

### Requirement: Task cards SHALL apply visual treatments per attention state

Cards for `blocked` tasks SHALL have a faint red background tint. Cards for `actively_working` tasks SHALL have a pulsing left border (opacity animation 0.4 → 1.0, 2s ease-in-out). Cards for `ready_to_archive` tasks SHALL be dimmed (opacity 0.75).

#### Scenario: Blocked card has red tint
- **WHEN** a task has attention state `blocked`
- **THEN** the card has a faint red background tint in addition to the red left border

#### Scenario: Actively working card has pulsing border
- **WHEN** a task has attention state `actively_working`
- **THEN** the card's 2px left border animates with an opacity pulse

### Requirement: Clicking a task card SHALL navigate to task detail

When the user clicks a task card on the board, the browser SHALL navigate to `/tasks/:taskId` where `:taskId` is the task's ID.

#### Scenario: Card click navigates to task detail
- **WHEN** the user clicks a card for task with ID `task-42`
- **THEN** the browser URL changes to `/tasks/task-42`
- **AND** the Task Detail screen renders

### Requirement: Board data SHALL load from GET /api/board

The board SHALL fetch task data from `GET /api/board` using TanStack Query with query key `["board"]`. While loading, the board SHALL display a loading indicator. If the request fails, the board SHALL display an error message.

#### Scenario: Board loads tasks from the API
- **WHEN** the Board screen mounts
- **THEN** a GET request is made to `/api/board`
- **AND** the response data is rendered as task cards in their respective stage columns

#### Scenario: Board shows loading state
- **WHEN** the board data is being fetched
- **THEN** the board displays a loading indicator

### Requirement: GET /api/board SHALL return tasks grouped by stage

The Fastify server SHALL handle `GET /api/board` and return a JSON response containing a `columns` array. Each column entry SHALL include the stage ID, label, and an array of task objects. Task objects SHALL include: `id`, `title`, `stage`, `attentionState`, `summary`, `projectSlug`, `lastActivityAt`, and `hasPullRequest`.

#### Scenario: Board endpoint returns grouped tasks
- **WHEN** `GET /api/board` is requested
- **THEN** the server returns HTTP 200 with a JSON body containing a `columns` array of 7 entries
- **AND** each entry has `stage`, `label`, and `tasks` properties
- **AND** each task object includes `id`, `title`, `stage`, `attentionState`, `summary`, `projectSlug`, `lastActivityAt`, and `hasPullRequest`

### Requirement: GET /api/board/schema SHALL return allowed moves and metadata from compiled workflow

The Fastify server SHALL handle `GET /api/board/schema` and return a JSON response containing `allowedMoves` (a map of stage to array of valid target stages), `stages` (ordered array of stage ID + label), and `attentionStates` (array of attention state ID + label). The `stages` and `allowedMoves` data SHALL come from the compiled workflow config (loaded from `.deliverator/workflow.yaml`), not from hardcoded constants in contracts. The `attentionStates` data SHALL come from the `ATTENTION_STATES` constant in contracts (since attention states are system-level).

#### Scenario: Board schema endpoint returns transition rules from compiled workflow
- **WHEN** `GET /api/board/schema` is requested
- **THEN** the server returns HTTP 200 with a JSON body
- **AND** the `stages` array reflects the stages defined in `.deliverator/workflow.yaml` in their configured order
- **AND** `allowedMoves` reflects the allowed manual transitions defined in the workflow config
- **AND** `attentionStates` contains the 7 system-level attention states with labels
