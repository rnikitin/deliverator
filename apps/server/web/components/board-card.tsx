import { cn } from "../lib/utils.js";
import { ATTENTION_BADGE_COLORS, ATTENTION_BADGE_FALLBACK, ATTENTION_BORDER_COLORS, ATTENTION_LABELS } from "../lib/board-styles.js";
import type { BoardTask } from "../hooks/use-board.js";

interface BoardCardProps {
  task: BoardTask;
  selected?: boolean;
  onSelect?: () => void;
}

export function BoardCard({ task, selected, onSelect }: BoardCardProps) {
  const borderClass = ATTENTION_BORDER_COLORS[task.attentionState] ?? "border-l-border";
  const badgeClass = ATTENTION_BADGE_COLORS[task.attentionState] ?? ATTENTION_BADGE_FALLBACK;
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
