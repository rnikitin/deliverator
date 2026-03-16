import { useState } from "react";
import { NavLink, Navigate, Outlet, Route, Routes } from "react-router";

import { useThemeStore } from "../lib/theme-store.js";
import { cn } from "../lib/utils.js";
import { useProjects } from "../hooks/use-projects.js";
import { Button } from "./ui/button.js";
import { NewProjectDialog } from "./new-project-dialog.js";
import { ProjectCard } from "./project-card.js";

const settingsItems = [
  { to: "/settings/projects", label: "Projects", note: "Registry, paths, workflow roots" },
  { to: "/settings/appearance", label: "Appearance", note: "Theme and visual preferences" }
] as const;

export function SettingsPage() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<Navigate replace to="/settings/projects" />} />
        <Route path="projects" element={<ProjectsSettingsSection />} />
        <Route path="appearance" element={<AppearanceSettingsSection />} />
      </Route>
    </Routes>
  );
}

function SettingsLayout() {
  return (
    <div className="p-8">
      <div className="max-w-[1200px]">
        <div className="border border-border bg-card">
          <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-b border-border lg:border-b-0 lg:border-r">
              <div className="border-b border-border/80 px-5 py-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Settings</p>
                <h1 className="mt-3 font-display text-3xl leading-none text-foreground">Control Room</h1>
                <p className="mt-3 max-w-xs font-body text-sm leading-6 text-muted-foreground">
                  Project registration and operator preferences live here instead of competing with daily work views.
                </p>
              </div>
              <nav className="p-3">
                {settingsItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "block border-t border-border/70 px-3 py-3 first:border-t-0",
                        isActive ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                      )
                    }
                  >
                    <p className="font-body text-sm font-medium">{item.label}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {item.note}
                    </p>
                  </NavLink>
                ))}
              </nav>
            </aside>

            <section className="min-w-0 bg-background/35">
              <Outlet />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsSettingsSection() {
  const { data, isLoading, error } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Projects</p>
          <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[0.95] text-foreground">
            Registered repositories and their live workflow footing.
          </h2>
          <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted-foreground">
            Add a repository path, let Deliverator provision its `.deliverator/shared` and `.deliverator/local`
            folders, then jump directly into its board.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setDialogOpen(true)}>
          Add Project
        </Button>
      </div>

      <div className="mt-6">
        {isLoading && <p className="font-mono text-sm text-muted-foreground">Loading projects...</p>}
        {error && <p className="font-mono text-sm text-destructive">Failed to load projects.</p>}

        {data && data.projects.length === 0 && (
          <div className="border border-border bg-card px-8 py-12">
            <p className="font-display text-2xl text-foreground">No projects registered</p>
            <p className="mt-3 max-w-xl font-body text-sm leading-6 text-muted-foreground">
              Register a repository path to create a project-scoped workflow home and make it available in the board switcher.
            </p>
            <Button variant="primary" size="lg" className="mt-6" onClick={() => setDialogOpen(true)}>
              Add First Project
            </Button>
          </div>
        )}

        {data && data.projects.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function AppearanceSettingsSection() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <div className="p-6 lg:p-8">
      <div className="border-b border-border/80 pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Appearance</p>
        <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[0.95] text-foreground">
          Keep the interface legible before making it expressive.
        </h2>
        <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted-foreground">
          Theme choice is intentionally simple: pick the environment that keeps the dashboard readable during long operator sessions.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {([
          {
            value: "light",
            title: "Light",
            note: "Bright, paper-like surfaces for daytime review."
          },
          {
            value: "dark",
            title: "Dark",
            note: "Higher contrast for lower-light environments."
          },
          {
            value: "system",
            title: "System",
            note: "Follow the OS preference automatically."
          }
        ] as const).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "border px-5 py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              theme === option.value
                ? "border-primary bg-card text-foreground"
                : "border-border bg-card/60 text-foreground hover:border-primary/40"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl leading-none">{option.title}</p>
              <span
                className={cn(
                  "inline-flex items-center border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]",
                  theme === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {theme === option.value ? "Active" : "Available"}
              </span>
            </div>
            <p className="mt-4 font-body text-sm leading-6 text-muted-foreground">{option.note}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
