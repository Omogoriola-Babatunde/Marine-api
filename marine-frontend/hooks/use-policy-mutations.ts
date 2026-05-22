"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { approvePolicy, rejectPolicy } from "@/lib/api-client";
import type { Policy } from "@/lib/types";

function invalidateAfterPolicyChange(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["policies", "mine"] });
  queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
}

export function useApprovePolicy() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; policy: Policy }, Error, string>({
    mutationFn: approvePolicy,
    onSuccess: () => {
      toast.success("Policy approved");
      invalidateAfterPolicyChange(queryClient);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useRejectPolicy() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; policy: Policy }, Error, string>({
    mutationFn: rejectPolicy,
    onSuccess: () => {
      toast.success("Policy rejected");
      invalidateAfterPolicyChange(queryClient);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
