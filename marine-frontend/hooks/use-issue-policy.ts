"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, issuePolicy } from "@/lib/api-client";
import type { IssuePolicyInput, IssuePolicyResponse } from "@/lib/types";
import { policyForQuoteKey } from "./use-policy-for-quote";

export function useIssuePolicy() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<IssuePolicyResponse, Error, IssuePolicyInput>({
    mutationFn: issuePolicy,
    onSuccess: (data, vars) => {
      queryClient.setQueryData(policyForQuoteKey(vars.quoteId), data.policy);
      queryClient.invalidateQueries({ queryKey: ["quote", vars.quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["policies", "mine"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 404) {
        toast.error("Quote not found.");
        router.push("/");
        return;
      }
      toast.error(err.message);
    },
  });
}
