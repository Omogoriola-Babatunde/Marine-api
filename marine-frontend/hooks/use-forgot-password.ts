"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/api-client";
import type { ForgotPasswordInput, ForgotPasswordResponse } from "@/lib/types";

export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordInput>({
    mutationFn: forgotPassword,
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
