"use client";

import { useEffect, useState } from "react";
import { AUTH_EVENT, getToken } from "@/lib/auth";

type AuthState = "checking" | "authed" | "unauthed";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("checking");

  useEffect(() => {
    const update = () => setState(getToken() ? "authed" : "unauthed");
    update();
    window.addEventListener("storage", update);
    window.addEventListener(AUTH_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(AUTH_EVENT, update);
    };
  }, []);

  useEffect(() => {
    if (state !== "unauthed") return;
    if (window.location.pathname === "/login") return;
    window.location.assign("/login");
  }, [state]);

  // "checking" matches SSR / first paint; "unauthed" while redirecting
  if (state !== "authed") return null;

  return <>{children}</>;
}
