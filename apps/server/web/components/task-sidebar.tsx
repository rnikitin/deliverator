import { useEffect } from "react";

import { cn } from "../lib/utils.js";
import { useTask } from "../hooks/use-task.js";

const ATTENTION_BADGE_COLORS: Record<string, string> = {
  actively_working: "bg-state-working text-white",
  awaiting_human_input: "bg-state-input text-white",
  awaiting_human_approval: "bg-state-approval text-white",
  blocked: "bg-state-blocked text-white",
  ready_for_feedback: "bg-state-feedback text-white",
  ready_to_archive: "bg-state-archive text-white",
  paused_for_human: "bg-state-paused text-white"
};

const ATTENTION_LABELS: Record<string, string> = {
  actively_working: "WORKING",
  awaiting_human_input: "NEEDS INPUT",
  awaiting_human_approval: "NEEDS APPROVAL",
  blocked: "BLOCKED",
  ready_for_feedback: "READY FOR REVIEW",
  ready_to_archive: "ARCHIVE",
  paused_for_human: "PAUSED"
};

const STAGE_DOT_COLORS: Record<string, string> = {
  inbox: "bg-stage-inbox",
  discovery: "bg-stage-discovery",
  research: "bg-stage-research",
  build_test: "bg-stage-build",
  feedback: "bg-stage-feedback",
  deploy: "bg-stage-deploy",
  done: "bg-stage-done"
};

interface TaskSidebarProps {
  taskId: string;
  onClose: () => void;
}

export function TaskSidebar({ taskId, onClose }: TaskSidebarProps) {
  const { data: task, isLoading, error } = useTask(taskId);

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

interface TaskSidebarContentProps {
  task: {
    id: string;
    title: string;
    stage: string;
    attentionState: string;
    summary: string;
    projectId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

function TaskSidebarContent({ task }: TaskSidebarContentProps) {
  const dotClass = STAGE_DOT_COLORS[task.stage] ?? "bg-muted-foreground";
  const badgeClass = ATTENTION_BADGE_COLORS[task.attentionState] ?? "bg-muted text-muted-foreground";
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
          Details
        </h3>
        <dl className="mt-2 space-y-2">
          <div className="flex items-center gap-3">
            <dt className="font-body text-sm text-muted-foreground">Stage</dt>
            <dd className="font-body text-sm text-foreground">{task.stage}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="font-body text-sm text-muted-foreground">Attention</dt>
            <dd className="font-body text-sm text-foreground">{task.attentionState}</dd>
          </div>
        </dl>
      </div>

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
