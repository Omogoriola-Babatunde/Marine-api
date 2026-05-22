"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchCertificateBlob } from "@/lib/api-client";

export function useCertificateUrl(policyNumber: string | null | undefined) {
  const query = useQuery({
    enabled: !!policyNumber,
    queryKey: ["certificate", policyNumber],
    queryFn: () => fetchCertificateBlob(policyNumber as string),
    staleTime: 60_000,
  });

  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data || !(query.data instanceof Blob)) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);

  return {
    url,
    isLoading: query.isLoading || (!!query.data && !url),
    error: query.error,
    refetch: query.refetch,
  };
}
