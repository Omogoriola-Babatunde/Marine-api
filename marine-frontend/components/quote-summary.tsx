import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quote } from "@/lib/types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function QuoteSummary({ quote }: { quote: Quote }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote #{quote.id.slice(0, 8)}</CardTitle>
        <CardDescription>
          {quote.origin} → {quote.destination}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Class</div>
          <div className="font-medium">{quote.classType}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Cargo</div>
          <div className="font-medium">{quote.cargoType}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Cargo value</div>
          <div className="font-medium">{usd.format(quote.cargoValue)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Premium</div>
          <div className="font-medium">{usd.format(quote.premium)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
