"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { listUsers } from "@/lib/api-client";
import type { UserRole } from "@/lib/types";

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

const ROLES: UserRole[] = ["ADMIN", "STAFF", "USER"];

export function useUserRoleCounts() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["users", "count", "ALL"],
        queryFn: () => listUsers({ limit: 1 }),
      },
      ...ROLES.map((r) => ({
        queryKey: ["users", "count", r],
        queryFn: () => listUsers({ role: r, limit: 1 }),
      })),
    ],
  });

  const [all, ...byRole] = queries.map((q) => q.data?.pagination.total ?? null);
  return {
    ALL: all,
    ADMIN: byRole[0],
    STAFF: byRole[1],
    USER: byRole[2],
  } as Record<"ALL" | UserRole, number | null>;
}
