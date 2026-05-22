"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyPolicyTimeseries, getMyQuoteTimeseries } from "@/lib/api-client";

const chartConfig = {
  quotes: { label: "Quotes", color: "var(--chart-1)" },
  policies: { label: "Policies", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function ActivityArea({ days = 30 }: { days?: number }) {
  const quotes = useQuery({
    queryKey: ["quotes", "mine", "timeseries", days],
    queryFn: () => getMyQuoteTimeseries(days),
  });
  const policies = useQuery({
    queryKey: ["policies", "mine", "timeseries", days],
    queryFn: () => getMyPolicyTimeseries(days),
  });

  const data = useMemo(() => {
    if (!quotes.data || !policies.data) return [];
    const byDate = new Map<string, { date: string; quotes: number; policies: number }>();
    for (const p of quotes.data.data) {
      byDate.set(p.date, { date: p.date, quotes: p.count, policies: 0 });
    }
    for (const p of policies.data.data) {
      const existing = byDate.get(p.date);
      if (existing) existing.policies = p.count;
      else byDate.set(p.date, { date: p.date, quotes: 0, policies: p.count });
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [quotes.data, policies.data]);

  const isLoading = quotes.isLoading || policies.isLoading;
  const total = data.reduce((sum, p) => sum + p.quotes + p.policies, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Quotes and policies, last {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : total === 0 ? (
          <div className="flex h-[280px] w-full items-center justify-center text-sm text-muted-foreground">
            No activity in the last {days} days
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={data} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="fillQuotes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-quotes)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-quotes)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillPolicies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-policies)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-policies)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={32}
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="quotes"
                stroke="var(--color-quotes)"
                fill="url(#fillQuotes)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="policies"
                stroke="var(--color-policies)"
                fill="url(#fillPolicies)"
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
