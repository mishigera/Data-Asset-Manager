import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: [api.metrics.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.metrics.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return api.metrics.dashboard.responses[200].parse(await res.json());
    },
  });
}
