import { NavLink, Outlet } from "react-router";

import { cn } from "../lib/utils.js";
import { useThemeStore } from "../lib/theme-store.js";

interface PlaceholderScreenProps {
  title: string;
  description?: string;
}

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      {description && (
        <p className="mt-2 font-body text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function Dashboard() {
  return (
    <PlaceholderScreen
      title="Dashboard"
      description="Attention summary, actionable items, and activity feed."
    />
  );
}

export function SettingsSystem() {
  return <PlaceholderScreen title="System" description="Running workers, queued reactions, failed runs, version, uptime, DB path, compiled workflow schema, observability endpoints." />;
}

const SETTINGS_NAV: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
  { to: "/settings", label: "Display", end: true },
  { to: "/settings/projects", label: "Projects" },
  { to: "/settings/system", label: "System" }
];

export function SettingsLayout() {
  return (
    <div className="flex min-h-0 flex-1">
      <aside className="w-48 border-r border-border p-4">
        <nav className="flex flex-col gap-1">
          {SETTINGS_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "px-3 py-1.5 font-body text-sm",
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

const THEME_OPTIONS: ReadonlyArray<{ value: "light" | "dark" | "system"; label: string; description: string }> = [
  { value: "light", label: "Light", description: "Light background, dark text" },
  { value: "dark", label: "Dark", description: "Dark background, light text" },
  { value: "system", label: "System", description: "Follow OS preference" }
];

export function SettingsDisplay() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Display</h1>
      <p className="mt-2 font-body text-sm text-muted-foreground">Appearance and display preferences.</p>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Theme</h2>
        <div className="mt-4 flex gap-4">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex w-40 flex-col border px-4 py-3 text-left transition-colors",
                theme === option.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              <span className="font-body text-base font-medium">{option.label}</span>
              <span className="mt-1 font-body text-xs text-muted-foreground">{option.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsProjects() {
  return <PlaceholderScreen title="Projects" description="Per-project overview with task summaries and health." />;
}

export function TaskPlan() {
  return <PlaceholderScreen title="Plan & Artifacts" description="ExecPlan, OpenSpec, and artifacts." />;
}

export function TaskRuns() {
  return <PlaceholderScreen title="Runs" description="Run history table." />;
}

export function TaskRun() {
  return <PlaceholderScreen title="Run Detail" description="Single run: logs, actions, artifacts." />;
}

export function TaskComments() {
  return <PlaceholderScreen title="Comments" description="Comment thread and attachments." />;
}
