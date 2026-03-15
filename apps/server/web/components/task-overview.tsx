import { useOutletContext } from "react-router";
import type { TaskData } from "../hooks/use-task.js";

interface TaskOutletContext {
  task: TaskData;
}

export function TaskOverview() {
  const { task } = useOutletContext<TaskOutletContext>();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">Summary</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground leading-relaxed">
          {task.summary}
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">Details</h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
          <dt className="font-body text-xs uppercase tracking-wider text-muted-foreground">Stage</dt>
          <dd className="font-mono text-sm text-foreground">{task.stage}</dd>
          <dt className="font-body text-xs uppercase tracking-wider text-muted-foreground">Attention State</dt>
          <dd className="font-mono text-sm text-foreground">{task.attentionState}</dd>
          <dt className="font-body text-xs uppercase tracking-wider text-muted-foreground">Project</dt>
          <dd className="font-mono text-sm text-foreground">{task.projectId}</dd>
        </dl>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">Latest Artifacts</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">No artifacts yet.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">Latest Comments</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">No comments yet.</p>
      </section>
    </div>
  );
}
