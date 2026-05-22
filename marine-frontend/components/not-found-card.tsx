"use client";

import { CompassIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotFoundCard({ homeHref = "/" }: { homeHref?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <CompassIcon className="size-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground tracking-widest">404</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Off the chart
        </h1>
        <p className="text-sm text-muted-foreground">
          We can&apos;t find the page you were looking for. The link may be stale, or the
          resource has been removed.
        </p>
      </div>
      <Button asChild>
        <Link href={homeHref}>Take me home</Link>
      </Button>
    </div>
  );
}
