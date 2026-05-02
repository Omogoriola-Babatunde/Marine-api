"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { createPersister, createQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createQueryClient());
  const [persister] = useState(() => createPersister());

  const queryTree = persister ? (
    <PersistQueryClientProvider client={client} persistOptions={{ persister }}>
      {children}
      <Toaster richColors position="top-center" />
    </PersistQueryClientProvider>
  ) : (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {queryTree}
    </ThemeProvider>
  );
}
