import { useState } from "react";

import { useProjects } from "../hooks/use-projects.js";
import { Button } from "./ui/button.js";
import { NewProjectDialog } from "./new-project-dialog.js";
import { ProjectCard } from "./project-card.js";

export function ProjectsPage() {
  const { data, isLoading, error } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Registered repositories and their current health.
          </p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          Add Project
        </Button>
      </div>

      <div className="mt-8">
        {isLoading && (
          <p className="font-mono text-sm text-muted-foreground">Loading projects...</p>
        )}

        {error && (
          <p className="font-mono text-sm text-destructive">Failed to load projects.</p>
        )}

        {data && data.projects.length === 0 && (
          <div className="border border-border bg-card px-8 py-12 text-center">
            <p className="font-display text-xl text-foreground">No projects registered</p>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Register a repository path to start tracking its workflow.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="mt-6"
              onClick={() => setDialogOpen(true)}
            >
              Add Project
            </Button>
          </div>
        )}

        {data && data.projects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
