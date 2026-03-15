import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useGlobalSSE(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource("/api/events/stream");

    source.addEventListener("task.moved", () => {
      void queryClient.invalidateQueries({ queryKey: ["board"] });
    });

    source.addEventListener("attention.changed", () => {
      void queryClient.invalidateQueries({ queryKey: ["board"] });
    });

    source.addEventListener("task.updated", (event) => {
      try {
        const data = JSON.parse(event.data) as { taskId?: string };
        if (data.taskId) {
          void queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
        }
      } catch {
        // ignore malformed events
      }
      void queryClient.invalidateQueries({ queryKey: ["board"] });
    });

    return () => {
      source.close();
    };
  }, [queryClient]);
}
