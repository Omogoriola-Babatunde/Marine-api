"use client";

import Link from "next/link";
import { use, useState } from "react";
import {
  ApprovePolicyDialog,
  RejectPolicyDialog,
} from "@/components/policy-decision-actions";
import { PolicyCertDownload } from "@/components/policy-cert-download";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { usePolicy } from "@/hooks/use-policy";
import { ngn } from "@/lib/format";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING_APPROVAL: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? dateFmt.format(d) : "—";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{children}</div>
    </div>
  );
}

export default function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: policy, isLoading, error } = usePolicy(id);
  const me = useAuthUser();
  const isAdmin = me?.role === "ADMIN";
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  return (
    <>
      <SiteHeader title="Policy" />
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : error || !policy ? (
          <Card>
            <CardHeader>
              <CardTitle>Policy not found</CardTitle>
              <CardDescription>
                We couldn&apos;t load this policy. It may have been removed or you might not have
                access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/policies">Back to policies</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="font-mono text-base">{policy.policyNumber}</CardTitle>
                  <CardDescription>
                    Issued {fmtDate(policy.createdAt)} · Customer{" "}
                    <span className="text-foreground">{policy.customerName}</span>
                  </CardDescription>
                </div>
                <Badge variant={statusVariant[policy.status] ?? "outline"}>
                  {policy.status}
                </Badge>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipment</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <Field label="Mode">{policy.mode ?? "—"}</Field>
                <Field label="Start date">{fmtDate(policy.startDate)}</Field>
                <Field label="End date">{fmtDate(policy.endDate)}</Field>
                <Field label="Route">
                  {policy.quote
                    ? `${policy.quote.origin} → ${policy.quote.destination}`
                    : "—"}
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <Field label="Proforma #">
                  <span className="font-mono break-all">
                    {policy.proformaInvoice ?? "—"}
                  </span>
                </Field>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field label="Currency">{policy.currency ?? "—"}</Field>
                  <Field label="Invoice value">
                    {policy.invoiceValue != null
                      ? `${policy.currency ?? ""} ${policy.invoiceValue.toLocaleString()}`.trim()
                      : "—"}
                  </Field>
                  <Field label="Exchange rate">{policy.exchangeRate ?? "—"}</Field>
                </div>
              </CardContent>
            </Card>

            {policy.quote && (
              <Card>
                <CardHeader>
                  <CardTitle>Quote</CardTitle>
                  <CardDescription>Premium charged when this policy was approved.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <Field label="Class">{policy.quote.classType}</Field>
                  <Field label="Cargo">{policy.quote.cargoType}</Field>
                  <Field label="Cargo value">{ngn(policy.quote.cargoValue)}</Field>
                  <Field label="Premium">{ngn(policy.quote.premium)}</Field>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              {isAdmin && policy.status === "PENDING_APPROVAL" && (
                <>
                  <Button variant="outline" onClick={() => setRejectOpen(true)}>
                    Reject
                  </Button>
                  <Button onClick={() => setApproveOpen(true)}>Approve</Button>
                </>
              )}
              {policy.status === "APPROVED" && (
                <PolicyCertDownload policyNumber={policy.policyNumber} />
              )}
            </div>

            <ApprovePolicyDialog
              policyId={policy.id}
              open={approveOpen}
              onOpenChange={setApproveOpen}
            />
            <RejectPolicyDialog
              policyId={policy.id}
              open={rejectOpen}
              onOpenChange={setRejectOpen}
            />
          </>
        )}
      </div>
    </>
  );
}
