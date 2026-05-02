import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
}

export function createPersister(): Persister | null {
  if (typeof window === "undefined") return null;
  try {
    const probeKey = "__rq_probe__";
    window.sessionStorage.setItem(probeKey, "1");
    window.sessionStorage.removeItem(probeKey);
    return createSyncStoragePersister({
      storage: window.sessionStorage,
      key: "marine-frontend-rq-cache",
    });
  } catch (err) {
    console.warn("[query-client] sessionStorage unavailable; persistence disabled.", err);
    return null;
  }
}
