"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getWalletBalance, topupWallet } from "@/lib/api-client";

export function useWalletBalance() {
  return useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: getWalletBalance,
  });
}

export function useWalletTopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: topupWallet,
    onSuccess: () => {
      toast.success("Wallet topped up");
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
