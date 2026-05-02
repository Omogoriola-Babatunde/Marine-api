"use client";

import { useQuery } from "@tanstack/react-query";
import type { Quote } from "@/lib/types";

export function useQuote(id: string) {
  return useQuery<Quote | undefined>({
    queryKey: ["quote", id],
    enabled: false,
  });
}
