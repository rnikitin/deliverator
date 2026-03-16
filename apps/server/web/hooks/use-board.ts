import { useQuery } from "@tanstack/react-query";

export interface BoardTask {
  id: string;
  projectId: string;
  title: string;
  stage: string;
  attentionState: string;
  summary: string;
}

export interface BoardColumn {
  stageId: string;
  label: string;
  tasks: BoardTask[];
}

export interface BoardData {
  project: {
    id: string;
    slug: string;
    name: string;
    rootPath: string;
    createdAt: string;
  };
  columns: BoardColumn[];
  allowedMoves: Record<string, string[]>;
}

async function fetchBoard(projectSlug: string): Promise<BoardData> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectSlug)}/board`);
  if (!response.ok) {
    throw new Error(`Board fetch failed: ${response.status}`);
  }
  return response.json() as Promise<BoardData>;
}

export function useBoard(projectSlug: string) {
  return useQuery({
    queryKey: ["project-board", projectSlug],
    queryFn: () => fetchBoard(projectSlug),
    enabled: Boolean(projectSlug)
  });
}
