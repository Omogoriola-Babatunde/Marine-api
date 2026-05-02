"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCertificateBlob } from "@/lib/api-client";
import "@/lib/pdf-worker";

export function CertificatePreview({ policyNumber }: { policyNumber: string }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

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

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="rounded border bg-muted/20">
      {fileUrl && containerWidth > 0 ? (
        <Document
          file={fileUrl}
          onLoadError={(err) => {
            toast.error("Couldn't render the certificate.");
            console.error("[certificate-preview] render failed", err);
          }}
          loading={<Skeleton className="aspect-[210/297] w-full" />}
        >
          <Page
            pageNumber={1}
            width={containerWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      ) : (
        <Skeleton className="aspect-[210/297] w-full" data-testid="cert-skeleton" />
      )}
    </div>
  );
}
