export function CertificatePreview({ policyNumber }: { policyNumber: string }) {
  const src = `/api/policy/certificate/${encodeURIComponent(policyNumber)}`;
  return (
    <iframe
      src={src}
      title={`Certificate of insurance ${policyNumber}`}
      className="aspect-[210/297] w-full rounded border bg-muted/20"
    />
  );
}
