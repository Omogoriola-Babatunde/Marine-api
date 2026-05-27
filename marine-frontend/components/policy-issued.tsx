"use client";

import { useEffect, useRef } from "react";
import { CertificatePreview } from "@/components/certificate-preview";
import { PolicyCertDownload } from "@/components/policy-cert-download";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Policy } from "@/lib/types";

export function PolicyIssued({ policy }: { policy: Policy }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isApproved = policy.status === "APPROVED";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle ref={headingRef} tabIndex={-1} className="outline-none">
            Policy issued — {policy.policyNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Customer:</span> {policy.customerName}
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span> {policy.status}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isApproved ? (
          <CertificatePreview policyNumber={policy.policyNumber} />
        ) : (
          <div className="aspect-[210/297] flex w-full items-center justify-center rounded border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
            Certificate will be available once an admin approves this policy.
          </div>
        )}
        <PolicyCertDownload policyNumber={policy.policyNumber} disabled={!isApproved} />
      </div>
    </div>
  );
}
