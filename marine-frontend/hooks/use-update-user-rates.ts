"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateUserRates } from "@/lib/api-client";
import type { UpdateUserRatesInput, UserListItem } from "@/lib/types";

type Args = { id: string; rates: UpdateUserRatesInput };

export function useUpdateUserRates() {
  const queryClient = useQueryClient();
  return useMutation<UserListItem, Error, Args>({
    mutationFn: ({ id, rates }) => updateUserRates(id, rates),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Updated rates for ${user.fullName}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
