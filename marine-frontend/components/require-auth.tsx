"use client";

import { useEffect, useState } from "react";
import { AUTH_EVENT, getStoredUser, getToken } from "@/lib/auth";

type AuthState = "checking" | "authed" | "unauthed";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("checking");
  const [mustReset, setMustReset] = useState(false);

  useEffect(() => {
    const update = () => {
      if (getToken()) {
        setState("authed");
        setMustReset(getStoredUser()?.mustChangePassword === true);
      } else {
        setState("unauthed");
        setMustReset(false);
      }
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener(AUTH_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(AUTH_EVENT, update);
    };
  }, []);

  useEffect(() => {
    if (state === "unauthed") {
      if (window.location.pathname === "/login") return;
      window.location.assign("/login");
      return;
    }
    if (state === "authed" && mustReset) {
      if (window.location.pathname === "/change-password") return;
      window.location.assign("/change-password");
    }
  }, [state, mustReset]);

  // "checking" matches SSR / first paint; "unauthed" / forced-reset while redirecting
  if (state !== "authed" || mustReset) return null;

  return <>{children}</>;
}
