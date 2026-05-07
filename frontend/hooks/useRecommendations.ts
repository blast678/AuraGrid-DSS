"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MOCK_RECOMMENDATIONS, type Recommendation } from "@/lib/mockData";

export function useRecommendations() {
  return useQuery<Recommendation[]>({
    queryKey: ["recommendations"],
    queryFn: async () => {
      try {
        const res = await api.getRecommendations();
        return res.data;
      } catch {
        return MOCK_RECOMMENDATIONS;
      }
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
