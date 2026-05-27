"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { PolicyRowActions } from "@/components/policy-row-actions";
import { SiteHeader } from "@/components/site-header";
import { StatusTabs } from "@/components/status-tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useAuthUser } from "@/hooks/use-auth-user";
import { getAllPolicies, getAllPolicyCounts, getMyPolicies, getMyPolicyCounts } from "@/lib/api-client";
import { ngn } from "@/lib/format";
import type { Policy, PolicyCounts } from "@/lib/types";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING_APPROVAL: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

const baseColumns: ColumnDef<Policy>[] = [
  {
    accessorKey: "policyNumber",
    header: "Policy",
    cell: ({ row }) => (
      <Link
        href={`/policies/${row.original.id}`}
        className="font-mono text-xs underline-offset-4 hover:underline"
      >
        {row.original.policyNumber}
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <Link
        href={`/policies/${row.original.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {row.original.customerName}
      </Link>
    ),
  },
  {
    id: "route",
    header: "Route",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.quote
          ? `${row.original.quote.origin} → ${row.original.quote.destination}`
          : "—"}
      </span>
    ),
  },
  {
    id: "premium",
    header: () => <div className="text-right">Premium</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.quote ? ngn(row.original.quote.premium) : "—"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? "outline"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <PolicyRowActions policy={row.original} />,
    size: 60,
  },
];

const issuedByColumn: ColumnDef<Policy> = {
  id: "issuedBy",
  header: "Issued by",
  cell: ({ row }) => (
    <span className="text-sm text-muted-foreground">
      {row.original.issuedBy?.fullName ?? "—"}
    </span>
  ),
};

const EMPTY_COUNTS: PolicyCounts = {
  ALL: 0,
  PENDING_APPROVAL: 0,
  APPROVED: 0,
  REJECTED: 0,
};

export default function PoliciesPage() {
  const me = useAuthUser();
  const isAdmin = me?.role === "ADMIN";
  const [status, setStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  const scope = isAdmin ? "all" : "mine";

  const countsQuery = useQuery({
    queryKey: ["policies", scope, "counts"],
    queryFn: () => (isAdmin ? getAllPolicyCounts() : getMyPolicyCounts()),
  });
  const counts = countsQuery.data ?? EMPTY_COUNTS;

  const query = useQuery({
    queryKey: ["policies", scope, status, page, limit],
    queryFn: () => {
      const args = {
        ...(status === "ALL" ? {} : { status }),
        page,
        limit,
      };
      return isAdmin ? getAllPolicies(args) : getMyPolicies(args);
    },
  });

  const columns = useMemo<ColumnDef<Policy>[]>(() => {
    if (!isAdmin) return baseColumns;
    // Insert "Issued by" right after the Customer column.
    return [...baseColumns.slice(0, 2), issuedByColumn, ...baseColumns.slice(2)];
  }, [isAdmin]);

  const tabs = useMemo(
    () => [
      { value: "ALL", label: "All", count: counts.ALL },
      { value: "PENDING_APPROVAL", label: "Pending", count: counts.PENDING_APPROVAL },
      { value: "APPROVED", label: "Approved", count: counts.APPROVED },
      { value: "REJECTED", label: "Rejected", count: counts.REJECTED },
    ],
    [counts]
  );

  return (
    <>
      <SiteHeader title="Policies" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <StatusTabs
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
          options={tabs}
        />

        <DataTable
          columns={columns}
          data={query.data?.data ?? []}
          isLoading={query.isLoading}
          emptyMessage={isAdmin ? "No policies in the system yet." : "No policies yet."}
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
