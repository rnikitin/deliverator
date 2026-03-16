import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { invalidateGlobalQueries } from "../lib/query-client.js";

interface TaskEventPayload {
  projectSlug?: string;
  taskId?: string;
}

export function useGlobalSSE(): void {
  const queryClient = useQueryClient();
  const invalidationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/events/stream");

    const debouncedInvalidateGlobal = () => {
      if (invalidationTimer.current) return;
      invalidationTimer.current = setTimeout(() => {
        invalidationTimer.current = null;
        invalidateGlobalQueries(queryClient);
      }, 100);
    };

    const invalidateProjectQueries = (projectSlug?: string, taskId?: string) => {
      if (projectSlug) {
        void queryClient.invalidateQueries({ queryKey: ["project-board", projectSlug] });
      }
      if (projectSlug && taskId) {
        void queryClient.invalidateQueries({ queryKey: ["project-task", projectSlug, taskId] });
      }
      debouncedInvalidateGlobal();
    };

    const handleTaskEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as TaskEventPayload;
        invalidateProjectQueries(data.projectSlug, data.taskId);
      } catch {
        debouncedInvalidateGlobal();
      }
    };

    source.addEventListener("task.moved", handleTaskEvent);
    source.addEventListener("attention.changed", handleTaskEvent);
    source.addEventListener("task.updated", handleTaskEvent);

    return () => {
      source.close();
      if (invalidationTimer.current) {
        clearTimeout(invalidationTimer.current);
        invalidationTimer.current = null;
      }
    };
  }, [queryClient]);
}
