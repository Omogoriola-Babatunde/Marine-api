"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPolicyCounts, getMyQuoteCounts, getWalletBalance } from "@/lib/api-client";

export function useDashboardStats() {
  const balance = useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: getWalletBalance,
  });

  const quoteCounts = useQuery({
    queryKey: ["quotes", "mine", "counts"],
    queryFn: getMyQuoteCounts,
  });

  const policyCounts = useQuery({
    queryKey: ["policies", "mine", "counts"],
    queryFn: getMyPolicyCounts,
  });

  const isLoading = balance.isLoading || quoteCounts.isLoading || policyCounts.isLoading;

  return {
    isLoading,
    walletBalance: balance.data?.wallet ?? null,
    totalQuotes: quoteCounts.data?.ALL ?? null,
    totalPolicies: policyCounts.data?.ALL ?? null,
    pendingPolicies: policyCounts.data?.PENDING_APPROVAL ?? null,
  };
}
