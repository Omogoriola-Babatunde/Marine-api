"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { NewQuoteDialog } from "@/components/new-quote-dialog";
import { QuoteRowActions } from "@/components/quote-row-actions";
import { SiteHeader } from "@/components/site-header";
import { StatusTabs } from "@/components/status-tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useQuoteStatusCounts } from "@/hooks/use-status-counts";
import { getMyQuotes } from "@/lib/api-client";
import type { Quote } from "@/lib/types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  GENERATED: "secondary",
  CONVERTED: "default",
  EXPIRED: "outline",
};

const columns: ColumnDef<Quote>[] = [
  {
    accessorKey: "cargoType",
    header: "Cargo",
    cell: ({ row }) => (
      <Link
        href={`/quotes/${row.original.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {row.original.cargoType}
      </Link>
    ),
  },
  {
    id: "route",
    header: "Route",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.origin} → {row.original.destination}
      </span>
    ),
  },
  { accessorKey: "classType", header: "Class" },
  {
    accessorKey: "cargoValue",
    header: () => <div className="text-right">Value</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{usd.format(row.original.cargoValue)}</div>
    ),
  },
  {
    accessorKey: "premium",
    header: () => <div className="text-right">Premium</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{usd.format(row.original.premium)}</div>
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
    cell: ({ row }) => <QuoteRowActions quote={row.original} />,
    size: 60,
  },
];

export default function QuotesPage() {
  const [status, setStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;
  const counts = useQuoteStatusCounts();

  const query = useQuery({
    queryKey: ["quotes", "mine", status, page, limit],
    queryFn: () =>
      getMyQuotes({
        ...(status === "ALL" ? {} : { status }),
        page,
        limit,
      }),
  });

  const tabs = useMemo(
    () => [
      { value: "ALL", label: "All", count: counts.ALL },
      { value: "GENERATED", label: "Generated", count: counts.GENERATED },
      { value: "CONVERTED", label: "Converted", count: counts.CONVERTED },
      { value: "EXPIRED", label: "Expired", count: counts.EXPIRED },
    ],
    [counts]
  );

  return (
    <>
      <SiteHeader title="Quotes" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <StatusTabs
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
            options={tabs}
          />
          <NewQuoteDialog />
        </div>

        <DataTable
          columns={columns}
          data={query.data?.data ?? []}
          isLoading={query.isLoading}
          emptyMessage="No quotes yet."
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
