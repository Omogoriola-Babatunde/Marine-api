"use client";

import { useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
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
import { getMyPolicies } from "@/lib/api-client";

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING_APPROVAL: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

export default function PoliciesPage() {
  const [status, setStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = useQuery({
    queryKey: ["policies", "mine", status, page, limit],
    queryFn: () =>
      getMyPolicies({
        ...(status === "ALL" ? {} : { status }),
        page,
        limit,
      }),
  });

  return (
    <>
      <SiteHeader title="Policies" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
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

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Premium</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                SKELETON_ROWS.map((id) => (
                  <TableRow key={id}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : query.data && query.data.data.length > 0 ? (
                query.data.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.policyNumber}</TableCell>
                    <TableCell className="font-medium">{p.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.quote ? `${p.quote.origin} → ${p.quote.destination}` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.quote ? usd.format(p.quote.premium) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status] ?? "outline"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {p.status === "APPROVED" ? (
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/api/policy/certificate/${encodeURIComponent(p.policyNumber)}`}
                            target="_blank"
                          >
                            <DownloadIcon />
                            Cert
                          </Link>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No policies yet.
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
