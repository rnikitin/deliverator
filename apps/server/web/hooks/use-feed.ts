import { useQuery } from "@tanstack/react-query";

export interface FeedEvent {
  id: string;
  projectSlug: string;
  projectName: string;
  taskId: string;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

async function fetchFeed(): Promise<FeedEvent[]> {
  const response = await fetch("/api/feed");
  if (!response.ok) {
    throw new Error(`Feed fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as { events: FeedEvent[] };
  return data.events;
}

export function useFeed() {
  return useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed
  });
}
