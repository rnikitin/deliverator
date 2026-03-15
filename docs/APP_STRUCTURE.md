# DELIVERATOR App Structure and Screen Architecture

Screen architecture, route map, navigation model, data flow patterns, and build priority for the DELIVERATOR UI.

This document defines **what pages exist, how they're navigated, and what each one shows**. It is the bridge between the design system (`docs/DESIGN_SYSTEM.md`) and screen implementation. No source code changes are introduced by this document.

---

## Route Map

| Route | Screen | Purpose |
| --- | --- | --- |
| `/` | Board | Kanban view — the primary operating surface |
| `/dashboard` | Dashboard | Attention summary — "what needs me right now?" |
| `/feed` | Feed | Chronological activity stream — "what happened?" |
| `/projects` | Projects | Per-project overview with task summaries and health |
| `/system` | System | Running workers, queued reactions, failed runs |
| `/tasks/:taskId` | Task Detail (overview) | Task header + overview tab (default) |
| `/tasks/:taskId/plan` | Task Detail (plan) | ExecPlan, OpenSpec, artifacts |
| `/tasks/:taskId/runs` | Task Detail (runs) | Run history table |
| `/tasks/:taskId/runs/:runId` | Task Detail (run) | Single run: logs, actions, artifacts |
| `/tasks/:taskId/comments` | Task Detail (comments) | Comment thread + attachments |
| `/settings` | Settings | Display prefs, system info |

---

## Application Shell

All routes render inside a shared `AppShell` layout component with `<Outlet>`.

```
┌──────────────────────────────────────────────────────────────┐
│ DELIVERATOR    [BOARD] [DASHBOARD] [FEED]    [⌘K] [●3] [⚙] │
└──────────────────────────────────────────────────────────────┘
```

- **Top bar** (48px, sticky) — not a sidebar. Kanban columns need maximum horizontal space.
- **Left region**: wordmark (links to `/`).
- **Center region**: primary nav tabs — Board, Dashboard, Feed, Projects.
- **Right region**: command palette trigger (`⌘K`), attention badge (count of items needing human action), System link, settings gear, dark/light toggle.
- System is in the right region (not primary nav) — it's an admin/debug surface, not a daily destination.

### Key Navigation Decisions

1. **Board as `/` (home)** — operators spend most time here; full picture on landing.
2. **Top bar, no sidebar** — 7 kanban columns at min 200px = 1400px; a sidebar steals a column.
3. **Task detail as full page** — tabs have substantial content (logs, artifacts); slide-over would need near-full-width anyway; real routes give bookmarkable URLs.
4. **Nested routes for task tabs** — parent route renders persistent header + action bar; tab switches don't remount.
5. **Feed as standalone screen** — a sidebar feed on the board would be too narrow or steal a column; dashboard's "recent activity" provides the quick-glance version.

---

## Screen Details

### Board (`/`)

The primary operating surface. All tasks as kanban cards across 7 stage columns.

**Columns**: inbox, discovery, research, build_test, feedback, deploy, done (done collapsed by default).

**Card content**:
- Attention state badge + 2px left border (colored by attention state)
- Title
- Stage dot + label
- Last activity timestamp
- PR indicator (if linked)

**Interactions**:
- Click card → task detail
- Drag-drop (constrained to `allowed_moves` from the workflow schema)
- Filter bar: project, attention state, priority
- Quick-move buttons on card hover

**Real-time**: SSE board stream updates cards without full refresh.

**Visual hierarchy**:
- `blocked` / `awaiting_human_approval` cards have elevated visual weight (red tint, amber accents per `DESIGN_SYSTEM.md`)
- `actively_working` cards pulse (2px left border opacity animation)
- `ready_to_archive` cards are dimmed (opacity 0.75)

---

### Dashboard (`/dashboard`)

The "morning glance." Answers: **"What needs my attention?"**

**Section 1 — Attention counters**: row of clickable state badges with counts. `BLOCKED (2)` / `NEEDS APPROVAL (1)` / etc. Clicking a counter filters the board to that attention state.

**Section 2 — Actionable items**: compact table of tasks needing human action (blocked, awaiting input, awaiting approval). Columns: title, stage, attention state, last update. Each row links to task detail.

**Section 3 — Recent activity**: last ~20 events as a compact timeline (reuses the feed event component in digest form). This is the quick-glance version of the full feed.

---

### Feed (`/feed`)

Chronological stream of system events. Answers: **"What happened?"** and **"What's happening now?"**

**Event list**: infinite-scrolling chronological entries. Each entry: timestamp (monospace), event type badge, task reference (link), description.

**Live mode**: default ON, new events appear at top. When scrolled away from top or paused, a "N new events" banner appears.

**Filters**: by event type (moves, runs, comments, approvals, artifacts), project, task, time range.

**Event types**:
- `task.created` — new task added
- `task.moved` — stage transition
- `attention.changed` — attention state change
- `run.started` — execution began
- `run.finished` — execution completed (success or failure)
- `comment.added` — human or system comment
- `approval.given` — approval recorded
- `artifact.indexed` — artifact stored

**Data sources**: historical from `GET /api/events?limit=50&before=<cursor>` (task_events table), real-time from SSE.

**Why the feed matters**: The board shows current state but not what changed. When multiple agents run concurrently, the operator needs temporal visibility — "Run #14 just failed on task X, task Y just moved to feedback" — without clicking into each task.

---

### Task Detail (`/tasks/:taskId`)

Deep view of a single task. 2 clicks max from board to any artifact.

**Persistent elements** (parent route, always visible):
- Back link to board
- Task title (Chakra Petch), stage dot + label, attention state badge
- Project name, PR link, workspace path
- Bottom action bar: allowed move buttons, approve, add comment

**Tabs** (nested routes):

#### Overview (`/tasks/:taskId`, default)
- Summary and gate info
- Key metrics (time in stage, run count)
- Latest artifacts (most recent canonical artifacts)
- Latest comments (last few entries)

#### Plan & Artifacts (`/tasks/:taskId/plan`)
- Current canonical artifacts rendered inline: ExecPlan markdown, OpenSpec, build report
- Artifact type sections with collapsible detail
- Historical snapshots grouped by run

#### Runs (`/tasks/:taskId/runs`)
- Run history table: ID, stage, status, started, duration
- Expand row for: action runs, log viewer, structured output, run-specific artifacts

#### Single Run (`/tasks/:taskId/runs/:runId`)
- Full log viewer with streaming support
- Action list with individual status
- Run artifacts
- Structured output / error detail

#### Comments (`/tasks/:taskId/comments`)
- Threaded comment list
- Attachments inline
- Approval entries displayed within the thread
- Comment input with upload support

---

### Projects (`/projects`)

Per-project overview. Answers: **"How is each project doing?"**

**Project cards/rows**: one per registered project. Each shows:
- Name, slug, repository path
- Task breakdown: count by stage as a mini stage bar (colored segments per `DESIGN_SYSTEM.md` stage tokens)
- Attention summary: count by attention state
- PR count
- Last activity timestamp

**Click project** → filters the board to that project (`/?project=slug`).

**Add project**: inline form or modal (name, repository path, slug auto-generated).

**Project health indicators**:
- Repo path reachable: green/red indicator
- Last successful run timestamp
- Any currently blocked tasks highlighted

---

### System (`/system`)

Operational internals. Answers: **"Is the system healthy? What's running?"**

**Workers**: table of running worker processes — worker ID, task, adapter, started, duration, status. Live-updating via SSE.

**Reaction queue**: pending reactions waiting to fire — trigger (comment, move, approval), target task, queued at, estimated action. Shows queue depth.

**Failed runs**: recent failed runs across all tasks — run ID, task, stage, error summary, failed at. Quick link to the run detail in task view.

**Reconcile loop**: last reconcile timestamp, actions taken, next scheduled run.

**Database stats** (read-only): total tasks, runs, artifacts, events. DB file size.

This screen is a power-user/admin tool — lower priority than operator-facing screens but valuable when debugging agent behavior or system issues.

---

### Settings (`/settings`)

Minimal in v1 (single-user, self-hosted). Project management is on `/projects`.

**Display preferences**:
- Dark/light toggle
- Density: compact / standard
- Done column default: collapsed / expanded

**System info** (read-only):
- Version, uptime
- DB path, DB file size
- Compiled workflow schema summary
- Observability endpoints

---

## Data Flow

### Client-side State

| Layer | Technology | Owns |
| --- | --- | --- |
| Server state | **TanStack Query** | All server data: board, tasks, runs, artifacts, comments, events, projects, system stats. Handles caching, refetch, optimistic mutations. |
| UI state | **Zustand** | UI-only concerns: filters, display preferences, dark mode, command palette open/close, notification counts, feed buffer. |

### SSE Integration

**Global `useGlobalSSE()` hook** — mounted in AppShell, active on all routes:

| Event | Action |
| --- | --- |
| `task.moved` / `attention.changed` | Invalidate board query |
| `task.updated` | Invalidate task query for the affected task |
| `run.started` / `run.finished` | Invalidate runs query |
| Any event | Increment notification counter, append to feed buffer |

**Per-task `useTaskSSE(taskId)` hook** — mounted in Task Detail parent route:

| Event | Action |
| --- | --- |
| `log.chunk` | Append to log viewer buffer (streaming) |
| `artifact.indexed` | Invalidate artifacts query for the task |
| `comment.added` | Invalidate comments query for the task |

### API Endpoints

Endpoints needed to support the screen architecture, grouped by screen.

#### Board + Dashboard
| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/board` | GET | All tasks with stage, attention state, summary fields |
| `/api/board/schema` | GET | Allowed moves, available filters, column config |
| `/api/tasks/:taskId/move` | POST | Move task to a new stage (constrained by allowed_moves) |

#### Task Detail
| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/tasks/:taskId` | GET | Full task record |
| `/api/tasks/:taskId/runs` | GET | Run history for a task |
| `/api/runs/:runId` | GET | Single run detail |
| `/api/runs/:runId/logs` | GET | Log content for a run |
| `/api/tasks/:taskId/artifacts/current` | GET | Current canonical artifacts |
| `/api/artifacts/:artifactId/content` | GET | Raw artifact content |
| `/api/tasks/:taskId/comments` | GET | Comment thread |
| `/api/tasks/:taskId/comments` | POST | Add a comment |
| `/api/tasks/:taskId/approvals` | POST | Record an approval |
| `/api/tasks/:taskId/stream` | GET | Per-task SSE stream |

#### Feed
| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/events` | GET | Historical events, cursor-paginated (`?limit=50&before=<cursor>`) |

#### Projects
| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create a new project |
| `/api/projects/:slug/summary` | GET | Task breakdown and health for a project |

#### System
| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/system/workers` | GET | Running worker processes |
| `/api/system/queue` | GET | Pending reaction queue |
| `/api/system/failed-runs` | GET | Recent failed runs across all tasks |
| `/api/system/stats` | GET | DB stats, reconcile status, system health |

---

## Operator Workflow Mapping

| Operator need | Screen | Why |
| --- | --- | --- |
| "What needs my attention?" | Dashboard | Aggregated attention counts, actionable items table |
| "What's the full picture?" | Board | Spatial view of all tasks across stages |
| "What's happening right now?" | Feed (live) | Real-time chronological events |
| "What happened overnight?" | Feed (time filter) | Historical event scroll |
| "I need to act on this task" | Task Detail | Deep view + action bar |
| "Something just happened" | Notification badge → Feed or Task | Badge increments, click navigates |
| "How is project X doing?" | Projects | Per-project task breakdown and health |
| "Is the system healthy?" | System | Workers, queue, failed runs, reconcile status |

---

## Build Priority

Implementation phases ordered by value delivery. Each phase builds on the previous.

### Phase A — Board + AppShell + Task Detail Overview

The board is the product. Without it, nothing works. AppShell establishes the navigation shell. Task detail overview proves the board-to-detail click-through.

**Delivers**: `AppShell`, Board screen, Task Detail parent route + Overview tab, basic routing.

### Phase B — Task Detail Tabs (Plan/Artifacts, Runs, Comments)

"2 clicks to ExecPlan" — the operator needs to see what agents produced. Artifact viewer, log viewer, comment thread.

**Delivers**: Plan & Artifacts tab, Runs tab, Single Run view (with log viewer), Comments tab.

### Phase C — Board Interactions + Task Actions

Move tasks, approve, drag-and-drop. Board filters. All constrained by `allowed_moves` from the workflow schema.

**Delivers**: drag-drop on board, move/approve actions, filter bar, quick-move buttons.

### Phase D — Dashboard

Attention summary for the morning glance. Derived from board data — not new backend work, mostly a frontend aggregation view.

**Delivers**: Dashboard screen with attention counters, actionable items table, recent activity digest.

### Phase E — Feed

Chronological activity stream. Requires events infrastructure maturity (task_events table, SSE event types). Adds temporal visibility for concurrent agent operations.

**Delivers**: Feed screen with live mode, event list, filters.

### Phase F — Projects

Per-project overview with task breakdowns. Depends on having multiple projects with tasks to show. Also hosts the "add project" flow.

**Delivers**: Projects screen with project cards, health indicators, add-project form.

### Phase G — System

Workers, queue, failed runs — operational internals. Requires the worker manager and reaction engine to be running. Valuable for debugging but not needed for basic task management.

**Delivers**: System screen with workers table, reaction queue, failed runs, reconcile status, DB stats.

### Phase H — Settings

Least urgent. Display preferences can use sensible defaults until this is built. System info is available at raw endpoints.

**Delivers**: Settings screen with display preferences and system info.

---

## Prerequisite: Contracts Reconciliation

Current `packages/contracts/src/index.ts` defines placeholder stages (`triage|ready|in_progress|review|blocked|done`) and attention states (`normal|needs_human|waiting_on_dependency|failed`). These must be updated to the research-defined values before any screen work begins:

**7 stages**: `inbox`, `discovery`, `research`, `build_test`, `feedback`, `deploy`, `done`

**7 attention states**: `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`

This is a separate change set, not part of this document. It aligns `packages/contracts` with `docs/DESIGN_SYSTEM.md` and the research pack.

---

## Cross-references

- Design tokens, typography, color system, component guidelines: `docs/DESIGN_SYSTEM.md`
- Workflow model and stage semantics: `docs/research/docs/04-workflow-model.md`
- Action/recipe/adapter contracts: `docs/research/docs/05-action-recipe-adapter-model.md`
- Backend API shape: `docs/research/docs/09-backend-api.md`
- Build order and implementation phases: `docs/research/docs/12-mvp-and-build-order.md`
- Codebase layout: `docs/research/docs/15-codebase-layout.md`
