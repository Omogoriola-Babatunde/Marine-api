"use client";

import { useQuery } from "@tanstack/react-query";
import { getPolicyForQuote } from "@/lib/api-client";

export function policyForQuoteKey(quoteId: string) {
  return ["policy", "for-quote", quoteId] as const;
}

export function usePolicyForQuote(quoteId: string) {
  return useQuery({
    queryKey: policyForQuoteKey(quoteId),
    queryFn: () => getPolicyForQuote(quoteId),
  });
}
