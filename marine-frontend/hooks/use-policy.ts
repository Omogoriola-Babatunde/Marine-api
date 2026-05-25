"use client";

import { useQuery } from "@tanstack/react-query";
import { getPolicyById } from "@/lib/api-client";

export function usePolicy(id: string) {
  return useQuery({
    enabled: !!id,
    queryKey: ["policy", id],
    queryFn: () => getPolicyById(id),
  });
}
