import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateGlobalQueries } from "../lib/query-client.js";

export interface RegisteredProject {
  id: string;
  slug: string;
  name: string;
  rootPath: string;
  createdAt: string;
}

export interface ProjectSummary {
  totalTasks: number;
  byStage: Record<string, number>;
  byAttention: Record<string, number>;
  lastActivityAt: string | null;
  pathReachable: boolean;
}

export type ProjectWithSummary = RegisteredProject & { summary: ProjectSummary };

interface ProjectsResponse {
  projects: ProjectWithSummary[];
  lastSelectedProjectSlug: string | null;
}


async function fetchProjects(): Promise<ProjectsResponse> {
  const response = await fetch("/api/projects");
  if (!response.ok) {
    throw new Error(`Projects fetch failed: ${response.status}`);
  }
  return response.json() as Promise<ProjectsResponse>;
}

async function registerProject(input: { rootPath: string; name?: string }) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Project registration failed: ${response.status}`);
  }

  return response.json() as Promise<{
    ok: true;
    project: RegisteredProject;
    gitignore: {
      updated: boolean;
      skipped: boolean;
      reason?: string;
    };
  }>;
}

async function pickFolder(): Promise<{ path: string | null; error?: string }> {
  const response = await fetch("/api/system/pick-folder", { method: "POST" });
  if (!response.ok) {
    throw new Error(`Folder picker failed: ${response.status}`);
  }
  return response.json() as Promise<{ path: string | null; error?: string }>;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects
  });
}

export function useRegisterProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerProject,
    onSuccess: async () => invalidateGlobalQueries(queryClient)
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectSlug: string) => {
      const response = await fetch(`/api/projects/${projectSlug}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      return response.json() as Promise<{ ok: boolean }>;
    },
    onSuccess: async () => invalidateGlobalQueries(queryClient)
  });
}

export function usePickFolder() {
  return useMutation({
    mutationFn: pickFolder
  });
}
