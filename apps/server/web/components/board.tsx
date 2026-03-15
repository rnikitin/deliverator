import { useCallback, useRef, useState } from "react";

import { cn } from "../lib/utils.js";
import { useBoard } from "../hooks/use-board.js";
import { BoardCard } from "./board-card.js";
import { TaskSidebar } from "./task-sidebar.js";

const STAGE_COLORS: Record<string, string> = {
  inbox: "border-b-stage-inbox",
  discovery: "border-b-stage-discovery",
  research: "border-b-stage-research",
  build_test: "border-b-stage-build",
  feedback: "border-b-stage-feedback",
  deploy: "border-b-stage-deploy",
  done: "border-b-stage-done"
};

export function Board() {
  const { data, isLoading, error } = useBoard();
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectTask = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId);
    if (!taskId || !scrollRef.current) return;

    // After state update, scroll the card into the visible (non-covered) area
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (!container) return;
      const card = container.querySelector(`[data-task-id="${taskId}"]`);
      if (!card) return;

      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const sidebarWidth = window.innerWidth / 2;
      const visibleRight = window.innerWidth - sidebarWidth;

      // If card's right edge is beyond the visible area, scroll right
      if (cardRect.right > visibleRight) {
        const scrollBy = cardRect.right - visibleRight + 40; // 40px breathing room
        container.scrollBy({ left: scrollBy, behavior: "smooth" });
      }
      // If card's left edge is off-screen to the left, scroll left
      else if (cardRect.left < containerRect.left) {
        const scrollBy = cardRect.left - containerRect.left - 40;
        container.scrollBy({ left: scrollBy, behavior: "smooth" });
      }
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-mono text-sm text-muted-foreground">Loading board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-mono text-sm text-destructive">
          Failed to load board: {error.message}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* Scroll container */}
      <div ref={scrollRef} className="h-[calc(100vh-40px)] overflow-x-auto">
        <div
          className="flex h-full"
          style={{ width: selectedTaskId ? "150vw" : "100vw" }}
        >
          {/* Columns — always exactly 100vw wide */}
          <div className="flex h-full w-screen shrink-0">
            {data.columns.map((column) => {
              const isDone = column.stageId === "done";
              const collapsed = isDone && !doneExpanded;
              const borderClass = STAGE_COLORS[column.stageId] ?? "border-b-border";

              return (
                <div
                  key={column.stageId}
                  className={cn(
                    "flex flex-col border-r border-border",
                    collapsed ? "w-12 min-w-12" : "min-w-[200px] flex-1"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 border-b-2 bg-background px-3 py-1.5",
                      borderClass
                    )}
                  >
                    {isDone ? (
                      <button
                        type="button"
                        onClick={() => setDoneExpanded(!doneExpanded)}
                        className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {collapsed ? (
                          <span className="[writing-mode:vertical-lr] rotate-180">
                            {column.label} ({column.tasks.length})
                          </span>
                        ) : (
                          <>
                            {column.label}
                            <span className="font-mono text-sm text-muted-foreground">
                              ({column.tasks.length})
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <span className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          {column.label}
                        </span>
                        <span className="font-mono text-sm text-muted-foreground">
                          ({column.tasks.length})
                        </span>
                      </>
                    )}
                  </div>

                  {!collapsed && (
                    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
                      {column.tasks.map((task) => (
                        <BoardCard
                          key={task.id}
                          task={task}
                          selected={task.id === selectedTaskId}
                          onSelect={() => selectTask(task.id === selectedTaskId ? null : task.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spacer — extra scroll area matching sidebar width */}
          {selectedTaskId && <div className="w-[50vw] shrink-0" />}
        </div>
      </div>

      {/* Task sidebar — fixed overlay on right */}
      {selectedTaskId && (
        <TaskSidebar
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
}
