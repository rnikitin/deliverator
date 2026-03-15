import { NavLink, Outlet, useParams } from "react-router";

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

const TABS: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
  { to: "", label: "Overview", end: true },
  { to: "plan", label: "Plan & Artifacts" },
  { to: "runs", label: "Runs" },
  { to: "comments", label: "Comments" }
];

export function TaskDetail() {
  const params = useParams();
  const taskId = params.taskId ?? "";
  const { data: task, isLoading, error } = useTask(taskId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-mono text-sm text-muted-foreground">Loading task...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-mono text-sm text-destructive">
          {error ? `Failed to load task: ${error.message}` : "Task not found"}
        </p>
      </div>
    );
  }

  const dotClass = STAGE_DOT_COLORS[task.stage] ?? "bg-muted-foreground";
  const badgeClass = ATTENTION_BADGE_COLORS[task.attentionState] ?? "bg-muted text-muted-foreground";
  const badgeLabel = ATTENTION_LABELS[task.attentionState] ?? task.attentionState;

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <NavLink to="/board" className="font-body text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to board
        </NavLink>

        <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
          {task.title}
        </h1>

        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
            <span className={cn("inline-block h-1.5 w-1.5", dotClass)} />
            {task.stage}
          </span>
          <span
            className={cn(
              "inline-block px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider",
              badgeClass
            )}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Tabs */}
        <nav className="mt-4 flex gap-0 border-b border-border">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 font-body text-sm font-medium",
                  isActive
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet context={{ task }} />
      </div>

      {/* Action bar */}
      <div className="border-t border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-muted-foreground">Allowed moves:</span>
          <button
            type="button"
            disabled
            className="border border-border bg-muted px-3 py-1 font-body text-xs text-muted-foreground"
          >
            Move (disabled)
          </button>
        </div>
      </div>
    </div>
  );
}
