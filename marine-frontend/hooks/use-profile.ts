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

function pickToastMessage(input: UpdateProfileInput): string {
  const changedProfile = input.fullName !== undefined || input.email !== undefined;
  const changedPassword = input.newPassword !== undefined;
  if (changedPassword && !changedProfile) return "Password updated";
  if (changedProfile && !changedPassword) return "Profile updated";
  return "Profile and password updated";
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<AuthUser, Error, UpdateProfileInput>({
    mutationFn: updateCurrentUser,
    onSuccess: (user, input) => {
      setStoredUser(user);
      queryClient.setQueryData(["auth", "me"], user);
      toast.success(pickToastMessage(input));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
