import { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { cn } from "../lib/utils.js";
import { STAGE_HEADER_COLORS } from "../lib/board-styles.js";
import { useBoard } from "../hooks/use-board.js";
import { buildTaskOverlaySearch, clearTaskOverlaySearch, readTaskOverlay } from "../lib/task-overlay.js";
import { BoardCard } from "./board-card.js";

export function Board() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ projectSlug: string }>();
  const projectSlug = params.projectSlug || "";
  const taskOverlay = readTaskOverlay(location.search);
  const selectedTaskId = taskOverlay.projectSlug === projectSlug ? taskOverlay.taskId : null;
  const { data, isLoading, error } = useBoard(projectSlug);
  const [doneExpanded, setDoneExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectTask = useCallback((taskId: string | null) => {
    if (!projectSlug) return;
    navigate({
      pathname: `/projects/${projectSlug}/board`,
      search: taskId
        ? buildTaskOverlaySearch(location.search, projectSlug, taskId)
        : clearTaskOverlaySearch(location.search)
    });
    if (!taskId || !scrollRef.current) return;

    // After state update, scroll the card into the visible (non-covered) area
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (!container) return;
      const card = container.querySelector(`[data-task-id="${CSS.escape(taskId)}"]`);
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
  }, [location.search, navigate, projectSlug]);

  if (!projectSlug) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-mono text-sm text-muted-foreground">Select a project to view its board.</p>
      </div>
    );
  }

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
              const borderClass = STAGE_HEADER_COLORS[column.stageId] ?? "border-b-border";

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
  );
}
