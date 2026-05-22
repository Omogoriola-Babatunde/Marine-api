"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCertificateUrl } from "@/hooks/use-certificate";

export function PolicyCertDownload({
  policyNumber,
  disabled = false,
}: {
  policyNumber: string;
  disabled?: boolean;
}) {
  const { url, isLoading } = useCertificateUrl(disabled ? undefined : policyNumber);
  const isDisabled = disabled || !url || isLoading;

  if (isDisabled) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        title={disabled ? "Certificate is available once the policy is APPROVED" : undefined}
      >
        <DownloadIcon />
        {isLoading ? "…" : "Cert"}
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" size="sm">
      <a
        href={url ?? "#"}
        download={`certificate-${policyNumber}.pdf`}
        target="_blank"
        rel="noreferrer"
      >
        <DownloadIcon />
        Cert
      </a>
    </Button>
  );
}
