"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, issuePolicy } from "@/lib/api-client";
import type { IssuePolicyInput, IssuePolicyResponse } from "@/lib/types";

export function useIssuePolicy() {
  const router = useRouter();

  return useMutation<IssuePolicyResponse, Error, IssuePolicyInput>({
    mutationFn: issuePolicy,
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
