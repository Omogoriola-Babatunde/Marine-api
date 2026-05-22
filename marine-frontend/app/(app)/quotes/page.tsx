"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { DeleteQuoteAction } from "@/components/delete-quote-action";
import { EditQuoteDialog } from "@/components/edit-quote-dialog";
import { NewQuoteDialog } from "@/components/new-quote-dialog";
import { SiteHeader } from "@/components/site-header";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyQuotes } from "@/lib/api-client";

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "GENERATED", label: "Generated" },
  { value: "CONVERTED", label: "Converted" },
  { value: "EXPIRED", label: "Expired" },
] as const;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  GENERATED: "secondary",
  CONVERTED: "default",
  EXPIRED: "outline",
};

const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

export default function QuotesPage() {
  const user = useAuthUser();
  const isAdmin = user?.role === "ADMIN";
  const [status, setStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = useQuery({
    queryKey: ["quotes", "mine", status, page, limit],
    queryFn: () =>
      getMyQuotes({
        ...(status === "ALL" ? {} : { status }),
        page,
        limit,
      }),
  });

  return (
    <>
      <SiteHeader title="Quotes" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <Tabs
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
          >
            <TabsList>
              {STATUS_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <NewQuoteDialog />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Premium</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                SKELETON_ROWS.map((id) => (
                  <TableRow key={id}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : query.data && query.data.data.length > 0 ? (
                query.data.data.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.cargoType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {q.origin} → {q.destination}
                    </TableCell>
                    <TableCell>{q.classType}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {usd.format(q.cargoValue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {usd.format(q.premium)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[q.status] ?? "outline"}>{q.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/quotes/${q.id}`}>Open</Link>
                        </Button>
                        <EditQuoteDialog quote={q} disabled={q.status !== "GENERATED"} />
                        {isAdmin && (
                          <DeleteQuoteAction
                            quoteId={q.id}
                            disabled={q.status !== "GENERATED"}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No quotes yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {query.data && query.data.pagination.pages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Page {query.data.pagination.page} of {query.data.pagination.pages} ·{" "}
              {query.data.pagination.total} total
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= query.data.pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
