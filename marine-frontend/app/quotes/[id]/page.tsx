"use client";

import { use, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PolicyForm } from "@/components/policy-form";
import { PolicyIssued } from "@/components/policy-issued";
import { QuoteSummary } from "@/components/quote-summary";
import { useQuote } from "@/hooks/use-quote";
import type { Policy } from "@/lib/types";

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quote } = useQuote(id);
  const [policy, setPolicy] = useState<Policy | null>(null);

  if (!quote) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <QuoteSummary quote={quote} />
      {policy ? (
        <PolicyIssued policy={policy} />
      ) : (
        <PolicyForm quoteId={id} onSuccess={(r) => setPolicy(r.policy)} />
      )}
    </div>
  );
}
