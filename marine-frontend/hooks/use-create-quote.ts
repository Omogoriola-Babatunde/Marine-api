"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createQuote } from "@/lib/api-client";
import type { CreateQuoteInput, Quote } from "@/lib/types";

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<Quote, Error, CreateQuoteInput>({
    mutationFn: createQuote,
    onSuccess: (quote) => {
      queryClient.setQueryData(["quote", quote.id], quote);
      router.push(`/quotes/${quote.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
