import { QuoteForm } from "@/components/quote-form";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Get a marine cargo quote</h1>
        <p className="text-muted-foreground">
          Fill in the cargo details to see your premium. You can issue a policy on the next
          step.
        </p>
      </header>
      <QuoteForm />
    </div>
  );
}
