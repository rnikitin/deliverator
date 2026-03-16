import { useQuery } from "@tanstack/react-query";

export interface DashboardData {
  counts: Record<string, number>;
  actionableItems: Array<{
    projectSlug: string;
    projectName: string;
    taskId: string;
    title: string;
    stage: string;
    attentionState: string;
    summary: string;
  }>;
  recentEvents: Array<{
    id: string;
    projectSlug: string;
    projectName: string;
    taskId: string;
    type: string;
    createdAt: string;
    payload: Record<string, unknown>;
  }>;
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error(`Dashboard fetch failed: ${response.status}`);
  }
  return response.json() as Promise<DashboardData>;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard
  });
}
