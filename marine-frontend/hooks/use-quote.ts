"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import type { Quote } from "@/lib/types";

export function useQuote(id: string) {
  return useQuery<Quote | undefined>({
    queryKey: ["quote", id],
    queryFn: skipToken,
  });
}
