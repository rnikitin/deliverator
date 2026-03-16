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
  project: {
    slug: string;
    name: string;
  };
  task: TaskData;
}

async function fetchTask(projectSlug: string, taskId: string): Promise<TaskData> {
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/tasks/${encodeURIComponent(taskId)}`
  );
  if (!response.ok) {
    throw new Error(`Task fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as TaskResponse;
  return data.task;
}

export function useTask(projectSlug: string, taskId: string) {
  return useQuery({
    queryKey: ["project-task", projectSlug, taskId],
    queryFn: () => fetchTask(projectSlug, taskId),
    enabled: Boolean(projectSlug && taskId)
  });
}
