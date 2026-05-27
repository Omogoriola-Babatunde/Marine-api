"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuoteById } from "@/lib/api-client";

export function useQuote(id: string) {
  return useQuery({
    enabled: !!id,
    queryKey: ["quote", id],
    queryFn: () => getQuoteById(id),
  });
}
