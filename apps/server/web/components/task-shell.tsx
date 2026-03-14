import { useEffect, useState } from "react";
import { Link } from "react-router";

import { initBrowserTelemetry } from "../telemetry.js";

interface TaskPayload {
  ok: boolean;
  task?: {
    attentionState: string;
    id: string;
    stage: string;
    summary: string;
    title: string;
  };
}

interface TaskShellProps {
  taskId: string;
}

export function TaskShell({ taskId }: TaskShellProps) {
  const [taskState, setTaskState] = useState<TaskPayload | null>(null);

  useEffect(() => {
    initBrowserTelemetry();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTask = async () => {
      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`);
      const payload = (await response.json()) as TaskPayload;

      if (mounted) {
        setTaskState(payload);
      }
    };

    void loadTask();

    return () => {
      mounted = false;
    };
  }, [taskId]);

  return (
    <main className="shell">
      <section className="task-shell">
        <span className="eyebrow">Task</span>
        <h1>{taskState?.task?.title || "Technical foundation bootstrap"}</h1>
        <p>
          {taskState?.task?.summary ||
            "This route proves that DELIVERATOR can serve task-centric UI and API behavior from the same Fastify-hosted site."}
        </p>
        <div className="meta">
          <span>Task ID: {taskId}</span>
          <span>Stage: {taskState?.task?.stage || "loading"}</span>
          <span>Attention: {taskState?.task?.attentionState || "loading"}</span>
          <Link to="/">Back to board shell</Link>
        </div>
      </section>
    </main>
  );
}
