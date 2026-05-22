"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCurrentUser, updateCurrentUser, type UpdateProfileInput } from "@/lib/api-client";
import { setStoredUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

export function useProfile() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<AuthUser, Error, UpdateProfileInput>({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => {
      setStoredUser(user);
      queryClient.setQueryData(["auth", "me"], user);
      toast.success("Profile updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
