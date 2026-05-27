"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCertificateUrl } from "@/hooks/use-certificate";

export function CertificatePreview({ policyNumber }: { policyNumber: string }) {
  const { url, isLoading, error } = useCertificateUrl(policyNumber);

  if (isLoading) {
    return <Skeleton className="aspect-[210/297] w-full rounded border" />;
  }

  if (error || !url) {
    return (
      <div className="aspect-[210/297] flex w-full items-center justify-center rounded border bg-muted/20 text-sm text-muted-foreground">
        {error?.message ?? "Certificate unavailable"}
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title={`Certificate of insurance ${policyNumber}`}
      className="aspect-[210/297] w-full rounded border bg-muted/20"
    />
  );
}
