"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
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

const chartConfig = {
  GENERATED: { label: "Generated", color: "var(--chart-1)" },
  CONVERTED: { label: "Converted", color: "var(--chart-2)" },
  EXPIRED: { label: "Expired", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function QuoteStatusDonut() {
  const { data, isLoading } = useQuery({
    queryKey: ["quotes", "mine", "counts"],
    queryFn: getMyQuoteCounts,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "GENERATED", value: data.GENERATED },
      { name: "CONVERTED", value: data.CONVERTED },
      { name: "EXPIRED", value: data.EXPIRED },
    ].filter((d) => d.value > 0);
  }, [data]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Quotes by status</CardTitle>
        <CardDescription>Lifetime breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {isLoading || !data ? (
          <Skeleton className="mx-auto aspect-square w-full max-w-[220px] rounded-full" />
        ) : data.ALL === 0 ? (
          <div className="flex aspect-square w-full max-w-[220px] mx-auto items-center justify-center text-sm text-muted-foreground">
            No quotes yet
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[220px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} strokeWidth={4}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox)) return null;
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-semibold"
                        >
                          {data.ALL}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 18}
                          className="fill-muted-foreground text-xs"
                        >
                          Quotes
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
