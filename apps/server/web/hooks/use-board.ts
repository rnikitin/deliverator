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
  columns: BoardColumn[];
  allowedMoves: Record<string, string[]>;
}

async function fetchBoard(): Promise<BoardData> {
  const response = await fetch("/api/board");
  if (!response.ok) {
    throw new Error(`Board fetch failed: ${response.status}`);
  }
  return response.json() as Promise<BoardData>;
}

export function useBoard() {
  return useQuery({
    queryKey: ["board"],
    queryFn: fetchBoard
  });
}
