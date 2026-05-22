"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPolicyCounts, getMyQuoteCounts } from "@/lib/api-client";

type QuoteStatusCounts = {
  ALL: number | null;
  GENERATED: number | null;
  CONVERTED: number | null;
  EXPIRED: number | null;
};

type PolicyStatusCounts = {
  ALL: number | null;
  PENDING_APPROVAL: number | null;
  APPROVED: number | null;
  REJECTED: number | null;
};

const EMPTY_QUOTE: QuoteStatusCounts = {
  ALL: null,
  GENERATED: null,
  CONVERTED: null,
  EXPIRED: null,
};

const EMPTY_POLICY: PolicyStatusCounts = {
  ALL: null,
  PENDING_APPROVAL: null,
  APPROVED: null,
  REJECTED: null,
};

export function useQuoteStatusCounts(): QuoteStatusCounts {
  const { data } = useQuery({
    queryKey: ["quotes", "mine", "counts"],
    queryFn: getMyQuoteCounts,
  });
  if (!data) return EMPTY_QUOTE;
  return {
    ALL: data.ALL,
    GENERATED: data.GENERATED,
    CONVERTED: data.CONVERTED,
    EXPIRED: data.EXPIRED,
  };
}

export function usePolicyStatusCounts(): PolicyStatusCounts {
  const { data } = useQuery({
    queryKey: ["policies", "mine", "counts"],
    queryFn: getMyPolicyCounts,
  });
  if (!data) return EMPTY_POLICY;
  return {
    ALL: data.ALL,
    PENDING_APPROVAL: data.PENDING_APPROVAL,
    APPROVED: data.APPROVED,
    REJECTED: data.REJECTED,
  };
}
