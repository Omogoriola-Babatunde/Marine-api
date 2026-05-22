"use client";

import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useLogout } from "@/hooks/use-logout";

export function SiteHeader() {
  const user = useAuthUser();
  const logout = useLogout();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="font-heading text-sm font-semibold tracking-tight">
          Marine Insurance
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.fullName}
              </span>
              <Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
                <LogOutIcon className="size-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Sign out</span>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
