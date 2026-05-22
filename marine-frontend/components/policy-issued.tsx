"use client";

import { useEffect, useRef } from "react";
import { CertificatePreview } from "@/components/certificate-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCertificateUrl } from "@/hooks/use-certificate";
import type { Policy } from "@/lib/types";

export function PolicyIssued({ policy }: { policy: Policy }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { url, isLoading } = useCertificateUrl(policy.policyNumber);

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
        <CertificatePreview policyNumber={policy.policyNumber} />
        <Button asChild disabled={!url || isLoading}>
          <a
            href={url ?? "#"}
            download={`certificate-${policy.policyNumber}.pdf`}
            aria-disabled={!url || isLoading}
          >
            {isLoading ? "Loading certificate…" : "Download certificate"}
          </a>
        </Button>
      </div>
    </div>
  );
}
