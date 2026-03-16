import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1
    }
  }
});

const GLOBAL_QUERY_KEYS = [["projects"], ["dashboard"], ["feed"]] as const;

export function invalidateGlobalQueries(qc: QueryClient): void {
  for (const queryKey of GLOBAL_QUERY_KEYS) {
    void qc.invalidateQueries({ queryKey });
  }
}
