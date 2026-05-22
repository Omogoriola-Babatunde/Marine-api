"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearToken } from "@/lib/auth";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    clearToken();
    queryClient.clear();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };
}
