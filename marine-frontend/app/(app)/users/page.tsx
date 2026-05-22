"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { SiteHeader } from "@/components/site-header";
import { StatusTabs } from "@/components/status-tabs";
import { UserRowActions } from "@/components/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserRoleCounts, useUsers } from "@/hooks/use-users";
import type { UserListItem, UserRole } from "@/lib/types";

const roleVariant: Record<UserRole, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  STAFF: "secondary",
  USER: "outline",
};

export default function UsersPage() {
  const me = useAuthUser();
  const isAdmin = me?.role === "ADMIN";
  const [role, setRole] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;
  const counts = useUserRoleCounts();

  const query = useUsers({
    page,
    limit,
    role: role === "ALL" ? undefined : (role as UserRole),
  });

  const tabs = useMemo(
    () => [
      { value: "ALL", label: "All Members", count: counts.ALL },
      { value: "ADMIN", label: "Admins", count: counts.ADMIN },
      { value: "STAFF", label: "Staff", count: counts.STAFF },
      { value: "USER", label: "Users", count: counts.USER },
    ],
    [counts]
  );

  const columns = useMemo<ColumnDef<UserListItem>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.fullName}
            {row.original.id === me?.id && (
              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={roleVariant[row.original.role]}>{row.original.role}</Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <UserRowActions user={row.original} isSelf={row.original.id === me?.id} />
        ),
        size: 60,
      },
    ],
    [me?.id]
  );

  if (me && !isAdmin) {
    return (
      <>
        <SiteHeader title="Users" />
        <div className="mx-auto w-full max-w-2xl px-4 py-10 text-sm text-muted-foreground">
          You don&apos;t have permission to view this page.
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title="Users" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <StatusTabs
          value={role}
          onValueChange={(v) => {
            setPage(1);
            setRole(v);
          }}
          options={tabs}
        />

        <DataTable
          columns={columns}
          data={query.data?.data ?? []}
          isLoading={query.isLoading}
          emptyMessage="No users found."
        />

        {query.data && (
          <DataTablePagination
            page={query.data.pagination.page}
            pages={query.data.pagination.pages}
            total={query.data.pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>
    </>
  );
}
