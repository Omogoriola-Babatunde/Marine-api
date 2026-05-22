"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateUserRole } from "@/lib/api-client";
import type { UserListItem, UserRole } from "@/lib/types";

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation<UserListItem, Error, { id: string; role: UserRole }>({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
