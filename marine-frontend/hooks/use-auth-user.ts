"use client";

import { useSyncExternalStore } from "react";
import { AUTH_EVENT, USER_STORAGE_KEY } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function readSnapshot(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  if (!raw) {
    cachedUser = null;
    return null;
  }
  try {
    cachedUser = JSON.parse(raw) as AuthUser;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT, callback);
  };
}

function getServerSnapshot(): AuthUser | null {
  return null;
}

export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);
}
