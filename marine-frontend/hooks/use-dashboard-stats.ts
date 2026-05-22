"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPolicies, getMyQuotes, getWalletBalance } from "@/lib/api-client";

export function useDashboardStats() {
  const balance = useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: getWalletBalance,
  });

  const quotes = useQuery({
    queryKey: ["quotes", "mine", "all"],
    queryFn: () => getMyQuotes({ limit: 1 }),
  });

  const policies = useQuery({
    queryKey: ["policies", "mine", "all"],
    queryFn: () => getMyPolicies({ limit: 1 }),
  });

  const pendingPolicies = useQuery({
    queryKey: ["policies", "mine", "pending"],
    queryFn: () => getMyPolicies({ status: "PENDING_APPROVAL", limit: 1 }),
  });

  const isLoading =
    balance.isLoading || quotes.isLoading || policies.isLoading || pendingPolicies.isLoading;

  return {
    isLoading,
    walletBalance: balance.data?.wallet ?? null,
    totalQuotes: quotes.data?.pagination.total ?? null,
    totalPolicies: policies.data?.pagination.total ?? null,
    pendingPolicies: pendingPolicies.data?.pagination.total ?? null,
  };
}
