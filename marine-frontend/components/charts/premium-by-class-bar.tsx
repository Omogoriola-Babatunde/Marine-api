"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyQuoteCounts } from "@/lib/api-client";
import { ngn, ngnShort } from "@/lib/format";

const chartConfig = {
  premium: { label: "Premium", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PremiumByClassBar() {
  const { data, isLoading } = useQuery({
    queryKey: ["quotes", "mine", "counts"],
    queryFn: getMyQuoteCounts,
  });

  const chartData = useMemo(() => {
    if (!data?.byClass) return [];
    const a = data.byClass.A ?? { premium: 0, count: 0, cargoValue: 0 };
    const b = data.byClass.B ?? { premium: 0, count: 0, cargoValue: 0 };
    return [
      { class: "A", premium: a.premium, count: a.count },
      { class: "B", premium: b.premium, count: b.count },
    ];
  }, [data]);

  const hasData = chartData.some((d) => d.premium > 0 || d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium by class</CardTitle>
        <CardDescription>Total premium across all your quotes</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-[220px] w-full" />
        ) : !hasData ? (
          <div className="flex h-[220px] w-full items-center justify-center text-sm text-muted-foreground">
            No quotes yet
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="class" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => ngnShort(Number(v))}
                width={70}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => ngn(Number(value))}
                  />
                }
              />
              <Bar dataKey="premium" fill="var(--color-premium)" radius={6} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
