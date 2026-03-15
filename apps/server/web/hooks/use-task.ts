import { useQuery } from "@tanstack/react-query";

export interface TaskData {
  id: string;
  projectId: string;
  title: string;
  stage: string;
  attentionState: string;
  summary: string;
}

interface TaskResponse {
  ok: boolean;
  task: TaskData;
}

async function fetchTask(taskId: string): Promise<TaskData> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`);
  if (!response.ok) {
    throw new Error(`Task fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as TaskResponse;
  return data.task;
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
    enabled: Boolean(taskId)
  });
}
