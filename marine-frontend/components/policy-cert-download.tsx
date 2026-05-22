"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCertificateUrl } from "@/hooks/use-certificate";

export function PolicyCertDownload({ policyNumber }: { policyNumber: string }) {
  const { url, isLoading } = useCertificateUrl(policyNumber);

  return (
    <Button asChild variant="ghost" size="sm" disabled={!url || isLoading}>
      <a
        href={url ?? "#"}
        download={`certificate-${policyNumber}.pdf`}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!url || isLoading}
      >
        <DownloadIcon />
        {isLoading ? "…" : "Cert"}
      </a>
    </Button>
  );
}
