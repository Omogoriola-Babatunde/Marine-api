"use client";

import type { AuthUser } from "@/lib/types";

const TOKEN_KEY = "marine.auth.token";
const USER_KEY = "marine.auth.user";
export const AUTH_EVENT = "marine:auth-change";

const isBrowser = (): boolean => typeof window !== "undefined";

function dispatchAuthChange(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  dispatchAuthChange();
}

export function clearToken(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  dispatchAuthChange();
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  dispatchAuthChange();
}

export const USER_STORAGE_KEY = USER_KEY;
