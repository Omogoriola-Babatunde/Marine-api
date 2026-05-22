"use client";

import { use, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PolicyForm } from "@/components/policy-form";
import { PolicyIssued } from "@/components/policy-issued";
import { QuoteSummary } from "@/components/quote-summary";
import { SiteHeader } from "@/components/site-header";
import { useQuote } from "@/hooks/use-quote";
import type { Policy } from "@/lib/types";

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quote } = useQuote(id);
  const [policy, setPolicy] = useState<Policy | null>(null);

  return (
    <>
      <SiteHeader title="Quote" />
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        {!quote ? (
          <EmptyState />
        ) : (
          <>
            <QuoteSummary quote={quote} />
            {policy ? (
              <PolicyIssued policy={policy} />
            ) : (
              <PolicyForm quoteId={id} onSuccess={(r) => setPolicy(r.policy)} />
            )}
          </>
        )}
      </div>
    </>
  );
}
