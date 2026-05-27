"use client";

import { ClockIcon, FileTextIcon, ScrollTextIcon, WalletIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { ngn } from "@/lib/format";

const number = new Intl.NumberFormat("en-US");

function StatValue({ value, format }: { value: number | null; format: (n: number) => string }) {
  if (value === null) return <Skeleton className="h-8 w-24" />;
  return <>{format(value)}</>;
}

export function SectionCards() {
  const { walletBalance, totalQuotes, totalPolicies, pendingPolicies } = useDashboardStats();

  return (
    <div className="grid grid-cols-2 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Wallet balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <StatValue value={walletBalance} format={(n) => ngn(n)} />
          </CardTitle>
          <CardAction>
            <WalletIcon className="size-5 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Available to debit on policy approval</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>My quotes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <StatValue value={totalQuotes} format={(n) => number.format(n)} />
          </CardTitle>
          <CardAction>
            <FileTextIcon className="size-5 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">All quotes you have created</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>My policies</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <StatValue value={totalPolicies} format={(n) => number.format(n)} />
          </CardTitle>
          <CardAction>
            <ScrollTextIcon className="size-5 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">All policies you have issued</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending approval</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <StatValue value={pendingPolicies} format={(n) => number.format(n)} />
          </CardTitle>
          <CardAction>
            <ClockIcon className="size-5 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Policies awaiting an admin decision</div>
        </CardFooter>
      </Card>
    </div>
  );
}
