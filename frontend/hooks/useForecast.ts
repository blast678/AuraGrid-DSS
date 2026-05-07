"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MOCK_FORECASTS, type ForecastPoint } from "@/lib/mockData";

export function useForecast(zone: string) {
  return useQuery<ForecastPoint[]>({
    queryKey: ["forecast", zone],
    queryFn: async () => {
      try {
        const res = await api.getForecast(zone);
        return res.data;
      } catch {
        // Graceful fallback to mock data when backend is offline
        return MOCK_FORECASTS[zone] ?? MOCK_FORECASTS["Koramangala"];
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}
