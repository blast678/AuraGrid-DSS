"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MOCK_DIRECTIVES, type Directive } from "@/lib/mockData";

export function useDirectives(zone: string) {
  return useQuery<Directive[]>({
    queryKey: ["directives", zone],
    queryFn: async () => {
      try {
        const res = await api.getDirectives(zone);
        return res.data;
      } catch {
        return MOCK_DIRECTIVES[zone] ?? MOCK_DIRECTIVES["Koramangala"];
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
