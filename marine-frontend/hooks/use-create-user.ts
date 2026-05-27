"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createUser } from "@/lib/api-client";
import type { CreateUserInput, UserListItem } from "@/lib/types";

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserListItem, Error, CreateUserInput>({
    mutationFn: createUser,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Created ${user.fullName}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
