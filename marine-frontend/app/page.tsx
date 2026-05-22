"use client";

import { useEffect } from "react";
import { getToken } from "@/lib/auth";

export default function HomePage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.location.replace(getToken() ? "/dashboard" : "/login");
  }, []);

  return null;
}
