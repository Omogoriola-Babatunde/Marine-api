"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getNotifications, login } from "@/lib/api-client";
import { setStoredUser, setToken } from "@/lib/auth";
import type { LoginInput, LoginResponse } from "@/lib/types";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: login,
    onSuccess: async ({ token, user }) => {
      setToken(token);
      setStoredUser(user);
      queryClient.setQueryData(["auth", "me"], user);
      // Prime the notifications cache with this user's data BEFORE we route, so
      // the bell badge is accurate on first paint instead of after the 30s poll.
      // prefetchQuery swallows errors itself — a notifications outage won't block login.
      await queryClient.prefetchQuery({
        queryKey: ["notifications"],
        queryFn: getNotifications,
      });
      toast.success(`Welcome back, ${user.fullName}`);
      router.push(user.role === "ADMIN" ? "/dashboard" : "/quotes");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
