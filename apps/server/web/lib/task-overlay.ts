const TASK_ID_PARAM = "taskId";
const TASK_PROJECT_PARAM = "taskProject";

export interface TaskOverlayState {
  projectSlug: string | null;
  taskId: string | null;
}

export function readTaskOverlay(search: string): TaskOverlayState {
  const params = new URLSearchParams(search);
  return {
    projectSlug: params.get(TASK_PROJECT_PARAM),
    taskId: params.get(TASK_ID_PARAM)
  };
}

export function buildTaskOverlaySearch(search: string, projectSlug: string, taskId: string): string {
  const params = new URLSearchParams(search);
  params.set(TASK_PROJECT_PARAM, projectSlug);
  params.set(TASK_ID_PARAM, taskId);
  const next = params.toString();
  return next ? `?${next}` : "";
}

export function clearTaskOverlaySearch(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(TASK_PROJECT_PARAM);
  params.delete(TASK_ID_PARAM);
  const next = params.toString();
  return next ? `?${next}` : "";
}
