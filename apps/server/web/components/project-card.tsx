import { useState } from "react";
import { Link } from "react-router";

import { ATTENTION_BADGE_COLORS, ATTENTION_BADGE_FALLBACK, ATTENTION_LABELS, STAGE_BAR_COLORS } from "../lib/board-styles.js";
import { useDeleteProject, type ProjectWithSummary } from "../hooks/use-projects.js";
import { cn, relativeTime, truncatePath } from "../lib/utils.js";
import { Button } from "./ui/button.js";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "./ui/dialog.js";

interface ProjectCardProps {
  project: ProjectWithSummary;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const deleteProject = useDeleteProject();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { summary } = project;
  const boardHref = `/projects/${project.slug}/board`;
  const stageEntries = Object.entries(summary.byStage)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  const attentionEntries = Object.entries(summary.byAttention)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  const attentionCount = attentionEntries.reduce((sum, [, count]) => sum + count, 0);
  const lastActivityLabel = summary.lastActivityAt ? `Last activity ${relativeTime(summary.lastActivityAt)}` : "No activity yet";
  const pathStatusClass = summary.pathReachable ? "bg-emerald-500" : "bg-amber-500";

  const handleDelete = async () => {
    await deleteProject.mutateAsync(project.slug);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="group border border-border bg-card transition-colors hover:border-foreground/20 hover:bg-card/90">
        <Link to={boardHref} className="block">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", pathStatusClass)} aria-hidden />
                <h3 className="truncate font-display text-xl leading-none text-foreground">{project.name}</h3>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{project.slug}</p>
              <p className="mt-3 truncate font-body text-sm text-muted-foreground">{truncatePath(project.rootPath, 56)}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-display text-2xl leading-none text-foreground">{summary.totalTasks}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Tasks</p>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pipeline</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {stageEntries.length > 0 ? `${stageEntries.length} active stages` : "No staged work"}
                </p>
              </div>
              {stageEntries.length > 0 ? (
                <div className="flex h-2 overflow-hidden bg-muted/50">
                  {stageEntries.map(([stage, count]) => (
                    <div
                      key={stage}
                      style={{
                        width: `${(count / Math.max(summary.totalTasks, 1)) * 100}%`,
                        backgroundColor: STAGE_BAR_COLORS[stage] ?? "hsl(var(--muted-foreground))"
                      }}
                      title={`${stage}: ${count}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-2 bg-muted/50" />
              )}
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Attention</p>
                <p className="font-mono text-[10px] text-muted-foreground">{attentionCount} flagged</p>
              </div>
              {attentionEntries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {attentionEntries.map(([state, count]) => (
                    <span
                      key={state}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                        ATTENTION_BADGE_COLORS[state] ?? ATTENTION_BADGE_FALLBACK
                      )}
                    >
                      <span className="font-display text-xs leading-none">{count}</span>
                      {ATTENTION_LABELS[state] ?? state}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-body text-sm text-muted-foreground">No active attention signals.</p>
              )}
            </section>
          </div>
        </Link>

        <div className="flex items-center justify-between gap-4 border-t border-border/70 px-5 py-3">
          <p className="font-body text-sm text-muted-foreground">{lastActivityLabel}</p>
          <div className="flex items-center gap-2">
            <Link
              to={boardHref}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary transition-transform group-hover:translate-x-0.5"
            >
              Open board
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove project</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-foreground">{project.name}</span> from the Deliverator registry.
              Project files and its <code className="font-mono text-xs">.deliverator</code> folder on disk will stay untouched.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="font-body text-sm leading-6 text-muted-foreground">
              This only removes the project from the app. You can add it back later from the same path.
            </p>
            {deleteProject.isError && (
              <p className="mt-3 font-mono text-xs text-destructive">
                Failed to remove the project. Try again.
              </p>
            )}
          </DialogBody>
          <DialogFooter className="justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? "Removing..." : "Remove Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
