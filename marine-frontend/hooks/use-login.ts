"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login } from "@/lib/api-client";
import { setStoredUser, setToken } from "@/lib/auth";
import type { LoginInput, LoginResponse } from "@/lib/types";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      setToken(token);
      setStoredUser(user);
      queryClient.setQueryData(["auth", "me"], user);
      toast.success(`Welcome back, ${user.fullName}`);
      router.push(user.role === "ADMIN" ? "/dashboard" : "/quotes");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
