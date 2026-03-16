import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

import { cn } from "../lib/utils.js";
import { useGlobalSSE } from "../hooks/use-global-sse.js";
import { useProjects } from "../hooks/use-projects.js";
import { clearTaskOverlaySearch, readTaskOverlay } from "../lib/task-overlay.js";
import { TaskSidebar } from "./task-sidebar.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./ui/dropdown-menu.js";
import { Button } from "./ui/button.js";

export function AppShell() {
  useGlobalSSE();
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useProjects();
  const currentProjectSlug =
    location.pathname.match(/^\/projects\/([^/]+)\//)?.[1] || data?.lastSelectedProjectSlug || null;
  const taskOverlay = readTaskOverlay(location.search);
  const currentProject = data?.projects.find((p) => p.slug === currentProjectSlug);
  const boardTarget = currentProjectSlug ? `/projects/${currentProjectSlug}/board` : "/settings/projects";
  const navItems: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
    { to: "/dashboard", label: "Dashboard" },
    { to: boardTarget, label: "Board" },
    { to: "/settings/projects", label: "Settings" }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-10 items-center border-b border-border bg-card px-4">
        <NavLink to={boardTarget} className="font-display text-base font-bold tracking-wide text-primary">
          DELIVERATOR
        </NavLink>

        <nav className="ml-8 flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "px-3 py-1 font-body text-sm font-medium transition-none",
                  isActive
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Project
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-48 justify-between gap-2">
                <span className="truncate">
                  {currentProject ? currentProject.name : "Select project"}
                </span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuLabel>Projects</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {data?.projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onSelect={() => navigate(`/projects/${project.slug}/board`)}
                  className={cn(
                    currentProjectSlug === project.slug && "bg-accent"
                  )}
                >
                  <span className="truncate">{project.name}</span>
                </DropdownMenuItem>
              ))}
              {data?.projects.length === 0 && (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">No projects</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/settings/projects")}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {taskOverlay.projectSlug && taskOverlay.taskId && (
        <TaskSidebar
          projectSlug={taskOverlay.projectSlug}
          taskId={taskOverlay.taskId}
          onClose={() =>
            navigate({
              pathname: location.pathname,
              search: clearTaskOverlaySearch(location.search)
            })
          }
        />
      )}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="shrink-0 opacity-60"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
