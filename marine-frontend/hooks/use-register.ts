"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { register } from "@/lib/api-client";
import type { RegisterInput, RegisterResponse } from "@/lib/types";

export function useRegister() {
  const router = useRouter();

  return useMutation<RegisterResponse, Error, RegisterInput>({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Account created. Please sign in.");
      router.push("/login");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
