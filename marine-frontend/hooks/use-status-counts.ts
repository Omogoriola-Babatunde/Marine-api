"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPolicyCounts, getMyQuoteCounts } from "@/lib/api-client";
import type { PolicyCounts, QuoteCounts } from "@/lib/types";

const EMPTY_QUOTE: Record<keyof QuoteCounts, number | null> = {
  ALL: null,
  GENERATED: null,
  CONVERTED: null,
  EXPIRED: null,
};

const EMPTY_POLICY: Record<keyof PolicyCounts, number | null> = {
  ALL: null,
  PENDING_APPROVAL: null,
  APPROVED: null,
  REJECTED: null,
};

export function useQuoteStatusCounts(): Record<keyof QuoteCounts, number | null> {
  const { data } = useQuery({
    queryKey: ["quotes", "mine", "counts"],
    queryFn: getMyQuoteCounts,
  });
  return data ?? EMPTY_QUOTE;
}

export function usePolicyStatusCounts(): Record<keyof PolicyCounts, number | null> {
  const { data } = useQuery({
    queryKey: ["policies", "mine", "counts"],
    queryFn: getMyPolicyCounts,
  });
  return data ?? EMPTY_POLICY;
}
