"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getNotifications, markNotificationAsRead } from "@/lib/api-client";
import type { Notification } from "@/lib/types";

const QUERY_KEY = ["notifications"] as const;

export function useNotifications() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getNotifications,
    // Light polling so the bell badge updates without manual refresh.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<Notification, Error, string>({
    mutationFn: markNotificationAsRead,
    onMutate: async (id) => {
      // Optimistic: flip isRead immediately so the badge feels snappy.
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Notification[]>(QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<Notification[]>(
          QUERY_KEY,
          previous.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
      }
      return { previous };
    },
    onError: (err, _id, context) => {
      const ctx = context as { previous?: Notification[] } | undefined;
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEY, ctx.previous);
      toast.error(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
