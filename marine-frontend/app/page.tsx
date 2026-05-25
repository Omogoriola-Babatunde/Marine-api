"use client";

import { useEffect } from "react";
import { getStoredUser, getToken } from "@/lib/auth";

export default function HomePage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getToken()) {
      window.location.replace("/login");
      return;
    }
    const user = getStoredUser();
    window.location.replace(user?.role === "ADMIN" ? "/dashboard" : "/quotes");
  }, []);

  return null;
}
