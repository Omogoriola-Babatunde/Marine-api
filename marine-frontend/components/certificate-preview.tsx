"use client";

import { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCertificateBlob } from "@/lib/api-client";
import "@/lib/pdf-worker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export function CertificatePreview({ policyNumber }: { policyNumber: string }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    fetchCertificateBlob(policyNumber)
      .then((blob) => {
        if (revoked) return;
        url = URL.createObjectURL(blob);
        setFileUrl(url);
      })
      .catch((err) => {
        toast.error("Couldn't load the certificate preview.");
        console.error("[certificate-preview] fetch failed", err);
      });
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [policyNumber]);

  if (!fileUrl) {
    return <Skeleton className="h-[800px] w-full max-w-[600px]" data-testid="cert-skeleton" />;
  }

  return (
    <div className="overflow-auto rounded border bg-muted/20 p-2">
      <Document
        file={fileUrl}
        onLoadError={(err) => {
          toast.error("Couldn't render the certificate.");
          console.error("[certificate-preview] render failed", err);
        }}
        loading={<Skeleton className="h-[800px] w-full max-w-[600px]" />}
      >
        <Page pageNumber={1} width={600} />
      </Document>
    </div>
  );
}
