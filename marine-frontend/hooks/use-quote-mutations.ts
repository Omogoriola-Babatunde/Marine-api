"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteQuote, updateQuote } from "@/lib/api-client";
import type { CreateQuoteInput, Quote } from "@/lib/types";

export function useUpdateQuote(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Quote, Error, Partial<CreateQuoteInput>>({
    mutationFn: (input) => updateQuote(id, input),
    onSuccess: (quote) => {
      queryClient.setQueryData(["quote", id], quote);
      queryClient.invalidateQueries({ queryKey: ["quotes", "mine"] });
      toast.success("Quote updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteQuote,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ["quote", id] });
      queryClient.invalidateQueries({ queryKey: ["quotes", "mine"] });
      toast.success("Quote deleted");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
