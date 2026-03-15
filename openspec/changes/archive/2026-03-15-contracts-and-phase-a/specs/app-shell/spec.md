## ADDED Requirements

### Requirement: AppShell SHALL render a persistent 48px top bar with navigation

The `AppShell` component SHALL render a sticky top bar (48px height) that persists across all route navigations. The left region SHALL contain the "DELIVERATOR" wordmark in Chakra Petch linking to `/`. The center region SHALL contain primary nav tabs: Board (`/`), Dashboard (`/dashboard`), Feed (`/feed`), Projects (`/projects`). The right region SHALL contain placeholder slots for a command palette trigger, attention badge, System link (`/system`), settings gear (`/settings`), and a dark/light mode toggle.

#### Scenario: Top bar is visible on every route
- **WHEN** the user navigates to `/`, `/dashboard`, `/feed`, `/projects`, `/system`, `/tasks/any-id`, or `/settings`
- **THEN** the 48px top bar is visible at the top of the viewport
- **AND** the "DELIVERATOR" wordmark is visible in the left region
- **AND** the primary nav tabs (Board, Dashboard, Feed, Projects) are visible in the center region

#### Scenario: Active nav tab is highlighted
- **WHEN** the user is on `/dashboard`
- **THEN** the Dashboard tab has a 2px bottom border in the primary color
- **AND** the other tabs do not have a primary-colored bottom border

#### Scenario: Wordmark navigates to board
- **WHEN** the user clicks the "DELIVERATOR" wordmark
- **THEN** the browser navigates to `/`

### Requirement: AppShell SHALL provide an Outlet for child route content

Below the top bar, the `AppShell` SHALL render a React Router `<Outlet>` that displays the matched child route's component. Route transitions SHALL NOT remount the AppShell.

#### Scenario: Route content renders below the top bar
- **WHEN** the user navigates from `/` to `/dashboard`
- **THEN** the content area below the top bar changes to the Dashboard screen
- **AND** the top bar does not re-render or flash

### Requirement: All routes from the route map SHALL be registered

The React Router configuration SHALL register all 11 routes defined in `docs/APP_STRUCTURE.md`. Routes for screens not yet implemented (Dashboard, Feed, Projects, System, Settings, and Task Detail tabs beyond Overview) SHALL render a placeholder component displaying the screen name as a heading.

#### Scenario: Direct URL navigation works for all routes
- **WHEN** the user enters `/feed` directly in the browser address bar and presses Enter
- **THEN** the Feed placeholder screen renders inside the AppShell
- **AND** no 404 error occurs

#### Scenario: Task detail nested routes are registered
- **WHEN** the user navigates to `/tasks/abc/runs`
- **THEN** the Task Detail parent layout renders with the Runs tab placeholder content

### Requirement: SPA catch-all SHALL serve the HTML shell for all client routes

The Fastify server SHALL register a catch-all route that returns the SPA HTML for any path not matched by API routes, health endpoints, or static assets. This ensures browser refresh and direct URL navigation work for all client-side routes.

#### Scenario: Browser refresh on a client route returns the SPA
- **WHEN** the user is on `/tasks/abc/plan` and presses the browser refresh button
- **THEN** the server returns HTTP 200 with the SPA HTML
- **AND** the React Router renders the correct route

### Requirement: TanStack Query provider SHALL wrap the application

The React application root SHALL include a `QueryClientProvider` with a configured `QueryClient`. The default stale time SHALL be 30 seconds. The default retry count SHALL be 1.

#### Scenario: Query client is available to all components
- **WHEN** any component calls `useQuery()` from `@tanstack/react-query`
- **THEN** the hook has access to the query client without additional provider setup

### Requirement: Global SSE hook SHALL invalidate queries on server events

A `useGlobalSSE()` hook SHALL be mounted in AppShell. It SHALL connect to `GET /api/events/stream` and invalidate TanStack Query caches when task-related events arrive.

#### Scenario: Board query refreshes on task.moved event
- **WHEN** the SSE stream emits a `task.moved` event
- **THEN** the TanStack Query cache for the `["board"]` query key is invalidated
- **AND** the board data refetches in the background

#### Scenario: SSE reconnects after disconnection
- **WHEN** the SSE connection drops
- **THEN** the hook reconnects automatically using the browser's native EventSource reconnection behavior
