## ADDED Requirements

### Requirement: Task Detail SHALL render a persistent header with task metadata

The Task Detail parent layout at `/tasks/:taskId` SHALL display a persistent header containing: a back link to the board (`/`), the task title in Chakra Petch, a stage dot colored by the task's current stage with a label, an attention state badge, and the project name.

#### Scenario: Header displays task metadata
- **WHEN** the user navigates to `/tasks/task-42`
- **THEN** the header shows the task's title in Chakra Petch
- **AND** the header shows a colored stage dot with the stage label
- **AND** the header shows the attention state badge with the correct color treatment
- **AND** the header shows the project name

#### Scenario: Back link returns to the board
- **WHEN** the user clicks the back link in the task detail header
- **THEN** the browser navigates to `/`

### Requirement: Task Detail SHALL render a tab bar with nested route links

The Task Detail layout SHALL include a tab bar below the header with tabs: Overview, Plan & Artifacts, Runs, Comments. Each tab SHALL be a link to its nested route. The active tab SHALL have a 2px bottom border in the primary color.

#### Scenario: Tab bar shows all tabs
- **WHEN** the user is on `/tasks/task-42`
- **THEN** the tab bar displays tabs for Overview, Plan & Artifacts, Runs, and Comments

#### Scenario: Active tab is highlighted
- **WHEN** the user is on `/tasks/task-42` (the overview tab)
- **THEN** the Overview tab has a 2px primary-colored bottom border
- **AND** the other tabs do not

#### Scenario: Tab navigation uses nested routes
- **WHEN** the user clicks the "Runs" tab
- **THEN** the browser URL changes to `/tasks/task-42/runs`
- **AND** the persistent header and tab bar remain visible
- **AND** the content area below the tab bar changes to the Runs tab content

### Requirement: Overview tab SHALL display task summary and key metrics

The Overview tab (default tab at `/tasks/:taskId`) SHALL display the task summary text, key metrics (stage, attention state, created-at timestamp, last-updated timestamp), a "Latest artifacts" section (placeholder showing "No artifacts yet" until Phase B), and a "Latest comments" section (placeholder showing "No comments yet" until Phase B).

#### Scenario: Overview tab shows summary and metrics
- **WHEN** the user is on `/tasks/task-42` (overview tab)
- **THEN** the task summary text is displayed
- **AND** the current stage and attention state are shown as metrics
- **AND** a "Latest artifacts" section is visible with placeholder text
- **AND** a "Latest comments" section is visible with placeholder text

### Requirement: Task Detail SHALL render a bottom action bar

The Task Detail layout SHALL include a bottom action bar below the tab content area. In Phase A, the action bar SHALL display allowed move buttons as disabled placeholders (actual move functionality is Phase C).

#### Scenario: Action bar shows disabled move buttons
- **WHEN** the user is on `/tasks/task-42`
- **THEN** the bottom action bar is visible
- **AND** it contains buttons representing allowed moves for the task's current stage
- **AND** the buttons are disabled

### Requirement: Task data SHALL load from GET /api/tasks/:taskId

The Task Detail SHALL fetch task data from `GET /api/tasks/:taskId` using TanStack Query with query key `["task", taskId]`. The response SHALL include all task fields plus the project name and project slug.

#### Scenario: Task detail loads from the API
- **WHEN** the user navigates to `/tasks/task-42`
- **THEN** a GET request is made to `/api/tasks/task-42`
- **AND** the response data populates the header, metrics, and summary

#### Scenario: Non-existent task shows error
- **WHEN** the user navigates to `/tasks/nonexistent`
- **THEN** the API returns HTTP 404
- **AND** the Task Detail shows an error message indicating the task was not found

### Requirement: Non-overview tabs SHALL render placeholder content

The Plan & Artifacts tab (`/tasks/:taskId/plan`), Runs tab (`/tasks/:taskId/runs`), single run view (`/tasks/:taskId/runs/:runId`), and Comments tab (`/tasks/:taskId/comments`) SHALL each render a placeholder component with the tab name as a heading. These are implemented in Phase B.

#### Scenario: Plan tab shows placeholder
- **WHEN** the user navigates to `/tasks/task-42/plan`
- **THEN** the content area shows a heading "Plan & Artifacts" with placeholder text
- **AND** the persistent header and tab bar remain visible with the Plan & Artifacts tab highlighted
