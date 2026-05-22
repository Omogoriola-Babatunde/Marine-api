"use client";

import { useQueries } from "@tanstack/react-query";
import { getMyPolicies, getMyQuotes } from "@/lib/api-client";

const QUOTE_STATUSES = ["GENERATED", "CONVERTED", "EXPIRED"] as const;
type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export function useQuoteStatusCounts() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["quotes", "mine", "count", "ALL"],
        queryFn: () => getMyQuotes({ limit: 1 }),
      },
      ...QUOTE_STATUSES.map((s) => ({
        queryKey: ["quotes", "mine", "count", s],
        queryFn: () => getMyQuotes({ status: s, limit: 1 }),
      })),
    ],
  });

  const [all, ...byStatus] = queries.map((q) => q.data?.pagination.total ?? null);
  return {
    ALL: all,
    GENERATED: byStatus[0],
    CONVERTED: byStatus[1],
    EXPIRED: byStatus[2],
  } as Record<"ALL" | QuoteStatus, number | null>;
}

const POLICY_STATUSES = ["PENDING_APPROVAL", "APPROVED", "REJECTED"] as const;
type PolicyStatus = (typeof POLICY_STATUSES)[number];

export function usePolicyStatusCounts() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["policies", "mine", "count", "ALL"],
        queryFn: () => getMyPolicies({ limit: 1 }),
      },
      ...POLICY_STATUSES.map((s) => ({
        queryKey: ["policies", "mine", "count", s],
        queryFn: () => getMyPolicies({ status: s, limit: 1 }),
      })),
    ],
  });

  const [all, ...byStatus] = queries.map((q) => q.data?.pagination.total ?? null);
  return {
    ALL: all,
    PENDING_APPROVAL: byStatus[0],
    APPROVED: byStatus[1],
    REJECTED: byStatus[2],
  } as Record<"ALL" | PolicyStatus, number | null>;
}
