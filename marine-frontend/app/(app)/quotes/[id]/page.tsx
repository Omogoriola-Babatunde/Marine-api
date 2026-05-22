"use client";

import { use } from "react";
import { EmptyState } from "@/components/empty-state";
import { PolicyForm } from "@/components/policy-form";
import { PolicyIssued } from "@/components/policy-issued";
import { QuoteSummary } from "@/components/quote-summary";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolicyForQuote } from "@/hooks/use-policy-for-quote";
import { useQuote } from "@/hooks/use-quote";

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quote, isLoading: quoteLoading } = useQuote(id);
  const { data: policy, isLoading: policyLoading } = usePolicyForQuote(id);

  return (
    <>
      <SiteHeader title="Quote" />
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        {quoteLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !quote ? (
          <EmptyState />
        ) : (
          <>
            <QuoteSummary quote={quote} />
            {policyLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : policy ? (
              <PolicyIssued policy={policy} />
            ) : (
              <PolicyForm quoteId={id} />
            )}
          </>
        )}
      </div>
    </>
  );
}
