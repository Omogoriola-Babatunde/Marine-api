"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserCounts, listUsers } from "@/lib/api-client";
import type { UserCounts, UserRole } from "@/lib/types";

export function useUsers({
  page = 1,
  limit = 100,
  role,
}: { page?: number; limit?: number; role?: UserRole } = {}) {
  return useQuery({
    queryKey: ["users", page, limit, role ?? "ALL"],
    queryFn: () => listUsers({ page, limit, role }),
  });
}

const EMPTY_USERS: Record<keyof UserCounts, number | null> = {
  ALL: null,
  ADMIN: null,
  STAFF: null,
  USER: null,
};

export function useUserRoleCounts(): Record<keyof UserCounts, number | null> {
  const { data } = useQuery({
    queryKey: ["users", "counts"],
    queryFn: getUserCounts,
  });
  return data ?? EMPTY_USERS;
}
