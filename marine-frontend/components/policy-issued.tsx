"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CertificatePreview } from "@/components/certificate-preview";
import type { Policy } from "@/lib/types";

export function PolicyIssued({ policy }: { policy: Policy }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const certHref = `/api/policy/certificate/${encodeURIComponent(policy.policyNumber)}`;

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
            <span className="text-muted-foreground">Customer:</span> {policy.customername}
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span> {policy.status}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <CertificatePreview policyNumber={policy.policyNumber} />
        <Button asChild>
          <a href={certHref} download>
            Download certificate
          </a>
        </Button>
      </div>
    </div>
  );
}
