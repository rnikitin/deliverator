import { useEffect } from "react";

import { cn } from "../lib/utils.js";
import { ATTENTION_BADGE_COLORS, ATTENTION_BADGE_FALLBACK, ATTENTION_LABELS, STAGE_DOT_COLORS } from "../lib/board-styles.js";
import { useTask, type TaskData } from "../hooks/use-task.js";

interface TaskSidebarProps {
  projectSlug: string;
  taskId: string;
  onClose: () => void;
}

export function TaskSidebar({ projectSlug, taskId, onClose }: TaskSidebarProps) {
  const { data: task, isLoading, error } = useTask(projectSlug, taskId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed right-0 top-10 z-10 flex h-[calc(100vh-40px)] w-[50vw] flex-col border-l border-border bg-card shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Task Detail
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center text-xl text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <p className="font-mono text-base text-muted-foreground">Loading...</p>
        )}

        {error && (
          <p className="font-mono text-base text-destructive">
            Failed to load task: {error.message}
          </p>
        )}

        {task && <TaskSidebarContent task={task} />}
      </div>

      {/* Action bar */}
      {task && (
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-body text-sm text-muted-foreground">Allowed moves:</span>
            <button
              type="button"
              disabled
              className="border border-border bg-muted px-4 py-1.5 font-body text-sm text-muted-foreground"
            >
              Move (disabled)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskSidebarContent({ task }: { task: TaskData }) {
  const dotClass = STAGE_DOT_COLORS[task.stage] ?? "bg-muted-foreground";
  const badgeClass = ATTENTION_BADGE_COLORS[task.attentionState] ?? ATTENTION_BADGE_FALLBACK;
  const badgeLabel = ATTENTION_LABELS[task.attentionState] ?? task.attentionState;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">{task.title}</h2>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 font-body text-base text-muted-foreground">
          <span className={cn("inline-block h-2.5 w-2.5", dotClass)} />
          {task.stage}
        </span>
        <span
          className={cn(
            "inline-block px-2 py-0.5 font-display text-xs font-semibold uppercase tracking-wider",
            badgeClass
          )}
        >
          {badgeLabel}
        </span>
      </div>

      {task.summary && (
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Summary
          </h3>
          <p className="mt-2 font-body text-base text-foreground">{task.summary}</p>
        </div>
      )}

      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Latest Artifacts
        </h3>
        <p className="mt-2 font-body text-sm text-muted-foreground italic">No artifacts yet</p>
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Latest Comments
        </h3>
        <p className="mt-2 font-body text-sm text-muted-foreground italic">No comments yet</p>
      </div>
    </div>
  );
}
