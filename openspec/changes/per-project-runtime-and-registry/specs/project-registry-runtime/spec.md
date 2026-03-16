## ADDED Requirements

### Requirement: DELIVERATOR SHALL start through a local CLI without Docker

DELIVERATOR SHALL provide a local CLI entrypoint that starts the application without Docker and without requiring a separate observability stack.

#### Scenario: deliverator start boots the app on a random free port
- **WHEN** the operator runs `deliverator start`
- **THEN** DELIVERATOR starts the web server in the foreground
- **AND** DELIVERATOR binds to a random free port by default
- **AND** DELIVERATOR writes the active runtime metadata to `~/.deliverator/run/current.json`
- **AND** DELIVERATOR prints the hosted URL to stdout

### Requirement: DELIVERATOR SHALL provide a Bun-backed development watch workflow

DELIVERATOR SHALL use Bun as the supported package manager and primary command layer for contributor workflows, and SHALL provide a Bun-backed watch-mode command for local development.

#### Scenario: bun run dev starts the local runtime in watch mode
- **WHEN** a contributor runs `bun run dev`
- **THEN** DELIVERATOR starts the local application runtime without Docker
- **AND** DELIVERATOR reruns or restarts the runtime on relevant source changes
- **AND** DELIVERATOR prints the active local URL after startup so the contributor can open the running app

### Requirement: DELIVERATOR SHALL expose the running instance through deliverator open

DELIVERATOR SHALL let the operator reopen the currently running local instance from another shell by using the runtime metadata stored under `~/.deliverator`.

#### Scenario: deliverator open opens the current instance
- **WHEN** `deliverator start` is already running and `~/.deliverator/run/current.json` contains a reachable URL
- **THEN** running `deliverator open` prints that URL
- **AND** DELIVERATOR opens the URL in the default browser

### Requirement: DELIVERATOR SHALL register projects by filesystem path

DELIVERATOR SHALL allow the operator to register a project by providing the path to the target project root. Registration SHALL create a durable registry entry that stores the project identity and root path, without storing the project’s tasks or workflow data in the app registry database.

#### Scenario: Registering a new project creates a registry record
- **WHEN** the operator submits a valid project root path that is not already registered
- **THEN** DELIVERATOR stores a registry record with a stable id, slug, name, and root path
- **AND** the project becomes available in the Projects screen and project switcher

#### Scenario: Re-registering an existing project is idempotent
- **WHEN** the operator submits a path that is already registered
- **THEN** DELIVERATOR returns the existing project entry
- **AND** DELIVERATOR SHALL NOT create a duplicate registry record

### Requirement: DELIVERATOR SHALL store global application state under ~/.deliverator

DELIVERATOR SHALL store its global registry and other truly cross-project application state under the operator-level `~/.deliverator` directory rather than under the DELIVERATOR repo working tree.

#### Scenario: Global registry database is created under ~/.deliverator
- **WHEN** DELIVERATOR starts and needs registry storage
- **THEN** the application creates or opens the registry database under `~/.deliverator/data/registry.db`
- **AND** registry and app-state tables are stored there rather than in a repo-local `.deliverator` directory

### Requirement: DELIVERATOR SHALL use searchable JSONL logs for local diagnostics

DELIVERATOR SHALL use structured JSONL log files as its default local diagnostic mechanism and SHALL allow local log search without Grafana, Loki, or other containerized backends.

#### Scenario: deliverator logs searches structured local logs
- **WHEN** the operator runs `deliverator logs --grep request_started`
- **THEN** DELIVERATOR reads JSONL log files from global and project-local log directories
- **AND** DELIVERATOR returns matching entries without requiring Docker or an external log backend

### Requirement: DELIVERATOR SHALL maintain per-project shared and local storage

Each registered project SHALL own its runtime and shared configuration under `<project>/.deliverator/`. DELIVERATOR SHALL create `.deliverator/shared` for versionable workflow/config files and `.deliverator/local` for local-only runtime state.

#### Scenario: Registration creates the expected project layout
- **WHEN** DELIVERATOR registers a valid project path
- **THEN** `<project>/.deliverator/shared` exists
- **AND** `<project>/.deliverator/local` exists
- **AND** `.deliverator/shared/workflow.yaml` exists
- **AND** `.deliverator/shared/project.yaml` exists
- **AND** `.deliverator/local/deliverator.db` can be created and migrated

#### Scenario: Shared files are preserved on repeat initialization
- **WHEN** a registered project already contains customized files under `.deliverator/shared`
- **THEN** DELIVERATOR SHALL NOT overwrite those files during later startup or registration

### Requirement: DELIVERATOR SHALL keep project-local state out of version control

DELIVERATOR SHALL treat `.deliverator/local` as local-only runtime state and SHALL keep `.deliverator/shared` versionable.

#### Scenario: Registration updates gitignore for a git-backed project
- **WHEN** the registered project is a git repository with a writable `.gitignore`
- **THEN** DELIVERATOR ensures `.deliverator/local/` is ignored
- **AND** DELIVERATOR SHALL NOT ignore `.deliverator/shared/`

#### Scenario: Registration succeeds for a non-git directory
- **WHEN** the registered project path is not a git repository
- **THEN** DELIVERATOR still registers the project and creates the `.deliverator/shared` and `.deliverator/local` directories
- **AND** DELIVERATOR reports that gitignore management was skipped

### Requirement: DELIVERATOR SHALL scope board and task views to a selected project

Board and task detail behavior SHALL be project-scoped. DELIVERATOR SHALL NOT assume that task ids are globally unique across all projects.

#### Scenario: Project board returns only that project’s tasks
- **WHEN** the operator requests `GET /api/projects/:projectSlug/board`
- **THEN** the response contains only tasks from that project’s local database
- **AND** the response SHALL NOT include tasks from other registered projects

#### Scenario: Project task detail uses project plus task identity
- **WHEN** the operator requests `GET /api/projects/:projectSlug/tasks/:taskId`
- **THEN** DELIVERATOR resolves the task inside the selected project context
- **AND** the response SHALL NOT rely on globally unique task ids

### Requirement: DELIVERATOR SHALL provide global dashboard and feed views across registered projects

Dashboard and feed SHALL remain global operator views that aggregate data across all registered projects through runtime fan-out over the registered project databases.

#### Scenario: Dashboard aggregates attention across multiple projects
- **WHEN** at least two projects are registered with tasks in different attention states
- **THEN** `GET /api/dashboard` returns counts and actionable items aggregated across both projects

#### Scenario: Feed aggregates events across multiple projects
- **WHEN** at least two projects contain task events
- **THEN** `GET /api/feed` returns a reverse-chronological list that includes events from multiple projects
- **AND** each returned event includes project identity for display

### Requirement: DELIVERATOR SHALL emit project-aware global SSE events

The global SSE stream SHALL remain a single stream, but every event payload SHALL include the originating `projectSlug` when the event belongs to a project.

#### Scenario: SSE payload carries project identity
- **WHEN** the operator opens `GET /api/events/stream`
- **THEN** DELIVERATOR emits a bootstrap event and later project-related events with `projectSlug`
- **AND** the client can use that field to invalidate project-scoped queries

### Requirement: DELIVERATOR SHALL redirect the root route based on project registry state

The application root route SHALL direct the operator to a meaningful surface based on whether registered projects exist.

#### Scenario: Empty registry redirects to projects
- **WHEN** no projects are registered
- **THEN** requesting `/` redirects to `/projects`

#### Scenario: Existing registry redirects to the last selected project board
- **WHEN** projects are registered and a last selected project is known
- **THEN** requesting `/` redirects to `/projects/:projectSlug/board` for that project
