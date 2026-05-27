"use client";

import { CheckCheckIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatAbsolute(value: string): string {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? dateFmt.format(d) : "";
}

function formatRelative(value: string): string {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

function linkHref(n: Notification): string | null {
  if (n.linkType === "POLICY" && n.linkId) return `/policies/${n.linkId}`;
  return null;
}

function linkLabel(n: Notification): string {
  if (n.linkType === "POLICY") return "View policy";
  return "Open";
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
}: {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const href = notification ? linkHref(notification) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {notification && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-8">
                <CheckCheckIcon
                  className={cn(
                    "size-4 shrink-0",
                    notification.isRead ? "text-green-500" : "text-muted-foreground/60"
                  )}
                  aria-hidden="true"
                />
                <span>{notification.title}</span>
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                <Badge
                  variant={notification.isRead ? "outline" : "default"}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {notification.isRead ? "Read" : "Unread"}
                </Badge>
                <span>{formatAbsolute(notification.createdAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatRelative(notification.createdAt)}</span>
              </DialogDescription>
            </DialogHeader>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {notification.message}
            </p>
            {href && (
              <DialogFooter>
                <Button asChild>
                  <Link href={href} onClick={() => onOpenChange(false)}>
                    <ExternalLinkIcon className="size-4" />
                    {linkLabel(notification)}
                  </Link>
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
