"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { PolicyRowActions } from "@/components/policy-row-actions";
import { SiteHeader } from "@/components/site-header";
import { StatusTabs } from "@/components/status-tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { usePolicyStatusCounts } from "@/hooks/use-status-counts";
import { getMyPolicies } from "@/lib/api-client";
import type { Policy } from "@/lib/types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING_APPROVAL: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

const columns: ColumnDef<Policy>[] = [
  {
    accessorKey: "policyNumber",
    header: "Policy",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.policyNumber}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
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
        {row.original.quote ? usd.format(row.original.quote.premium) : "—"}
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

export default function PoliciesPage() {
  const [status, setStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;
  const counts = usePolicyStatusCounts();

  const query = useQuery({
    queryKey: ["policies", "mine", status, page, limit],
    queryFn: () =>
      getMyPolicies({
        ...(status === "ALL" ? {} : { status }),
        page,
        limit,
      }),
  });

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
          emptyMessage="No policies yet."
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
