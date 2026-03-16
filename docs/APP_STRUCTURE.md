# App Structure

This document describes the current DELIVERATOR screen model and route structure.

## Route Map

| Route | Surface | Scope |
| --- | --- | --- |
| `/` | Redirect to last selected board or projects | Global entry |
| `/dashboard` | Dashboard | Global |
| `/feed` | Feed | Global |
| `/projects` | Project registry | Global |
| `/projects/:projectSlug/board` | Board | Project |
| `/projects/:projectSlug/tasks/:taskId` | Task detail | Project |

## Navigation Model

The SPA renders inside one `AppShell` with:
- primary nav for Dashboard, Feed, Projects, and Board
- a project switcher in the top bar
- route-driven board/task detail navigation

## Screen Responsibilities

### Dashboard

Global operator surface for:
- cross-project counts
- actionable tasks
- recent events

### Feed

Global chronological event stream across registered projects.

### Projects

Registry management surface for:
- listing registered projects
- adding a project by filesystem path
- navigating to the project board

### Board

Project-scoped kanban board:
- columns come from that project's compiled workflow
- tasks come only from that project's local DB
- route identity is `projectSlug`

### Task Detail

Project-scoped task view:
- route identity is `projectSlug + taskId`
- task data must not leak across projects

## Data Flow

- Global queries:
  - projects
  - dashboard
  - feed
- Project-scoped queries:
  - board
  - compiled config
  - task detail
- Global SSE stays one stream, but payloads include `projectSlug` so the client can invalidate project-scoped queries correctly.
