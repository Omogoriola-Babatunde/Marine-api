"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCheckIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { NotificationDetailDialog } from "@/components/notification-detail-dialog";
import { SiteHeader } from "@/components/site-header";
import { DataTable } from "@/components/ui/data-table";
import { useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatWhen(value: string): string {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? dateFmt.format(d) : "";
}

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [selected, setSelected] = useState<Notification | null>(null);
  const [open, setOpen] = useState(false);

  const items: Notification[] = data ?? [];
  const unreadCount = items.filter((n) => !n.isRead).length;

  const columns = useMemo<ColumnDef<Notification>[]>(
    () => [
      {
        id: "status",
        header: () => <span className="sr-only">Read status</span>,
        size: 48,
        cell: ({ row }) => {
          const read = row.original.isRead;
          return (
            <CheckCheckIcon
              className={cn(
                "size-4",
                read ? "text-green-500" : "text-muted-foreground/60"
              )}
              aria-label={read ? "Read" : "Unread"}
            />
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span
            className={cn(
              "text-sm",
              row.original.isRead ? "text-muted-foreground" : "font-semibold"
            )}
          >
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => (
          <span className="line-clamp-1 text-sm text-muted-foreground">
            {row.original.message}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-right">When</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs uppercase tracking-wider text-muted-foreground">
            {formatWhen(row.original.createdAt)}
          </div>
        ),
      },
    ],
    []
  );

  const handleRowClick = (n: Notification) => {
    setSelected(n);
    setOpen(true);
    if (!n.isRead) markRead.mutate(n.id);
  };

  return (
    <>
      <SiteHeader title="Notifications" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="text-sm text-muted-foreground">
          {items.length} total · {unreadCount} unread
        </div>
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage="You're all caught up."
          onRowClick={handleRowClick}
        />
      </div>
      <NotificationDetailDialog
        notification={selected}
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSelected(null);
        }}
      />
    </>
  );
}
