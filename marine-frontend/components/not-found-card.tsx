"use client";

import { ShipIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const RING_RADII = [14, 28, 44, 60, 78, 96, 116, 138, 162];
const CENTERS = [180, 500, 820];

function NotFoundRings() {
  return (
    <svg
      viewBox="0 0 1000 380"
      className="h-auto w-full max-w-3xl text-foreground"
      aria-hidden="true"
    >
      <title>404</title>
      {CENTERS.map((cx) => (
        <g key={cx} transform={`translate(${cx} 190)`}>
          {RING_RADII.map((r, i) => (
            <circle
              key={r}
              cx={0}
              cy={0}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.6}
              opacity={Math.max(0.08, 0.9 - i * 0.1)}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function NotFoundCard({ homeHref = "/" }: { homeHref?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
      <div className="relative w-full">
        <NotFoundRings />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-foreground">
            <ShipIcon className="size-5" />
            <span className="font-heading text-sm font-medium tracking-tight">
              Marine Insurance
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-sm space-y-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Looks like this page is off the chart. The link may be stale, or the resource
          has drifted out of port.
        </p>
        <p className="text-sm text-muted-foreground">
          Head back to{" "}
          <Link
            href={homeHref}
            className="text-foreground underline-offset-4 hover:underline"
          >
            home
          </Link>{" "}
          to set a new course.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href={homeHref}>Take me home</Link>
      </Button>
    </div>
  );
}
