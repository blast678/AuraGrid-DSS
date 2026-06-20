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
        // Backend now returns the EXACT data format we need, so we just pass it straight through!
        return res.data as Recommendation[];
      } catch (error) {
        console.warn("⚠️ Backend unreachable, falling back to Mock Data");
        return MOCK_RECOMMENDATIONS;
      }
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}