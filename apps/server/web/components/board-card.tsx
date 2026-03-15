import { cn } from "../lib/utils.js";
import type { BoardTask } from "../hooks/use-board.js";

const ATTENTION_BORDER_COLORS: Record<string, string> = {
  actively_working: "border-l-state-working",
  awaiting_human_input: "border-l-state-input",
  awaiting_human_approval: "border-l-state-approval",
  blocked: "border-l-state-blocked",
  ready_for_feedback: "border-l-state-feedback",
  ready_to_archive: "border-l-state-archive",
  paused_for_human: "border-l-state-paused"
};

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

interface BoardCardProps {
  task: BoardTask;
  selected?: boolean;
  onSelect?: () => void;
}

export function BoardCard({ task, selected, onSelect }: BoardCardProps) {
  const borderClass = ATTENTION_BORDER_COLORS[task.attentionState] ?? "border-l-border";
  const badgeClass = ATTENTION_BADGE_COLORS[task.attentionState] ?? "bg-muted text-muted-foreground";
  const badgeLabel = ATTENTION_LABELS[task.attentionState] ?? task.attentionState;

  return (
    <button
      type="button"
      data-task-id={task.id}
      onClick={onSelect}
      className={cn(
        "w-full border border-border bg-card px-3 py-2 text-left",
        "border-l-2",
        borderClass,
        selected && "ring-1 ring-primary",
        task.attentionState === "blocked" && "bg-[hsl(var(--state-blocked)/0.06)]",
        task.attentionState === "actively_working" && "animate-[pulse-border_2s_ease-in-out_infinite]",
        task.attentionState === "ready_to_archive" && "opacity-75",
        "hover:border-[hsl(var(--foreground)/0.2)]"
      )}
    >
      <p className="font-body text-base font-medium text-foreground leading-tight">
        {task.title}
      </p>
      <span
        className={cn(
          "mt-1 inline-block px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider",
          badgeClass
        )}
      >
        {badgeLabel}
      </span>
    </button>
  );
}
