"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface StatusTabOption {
  value: string;
  label: string;
  count?: number | null;
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<StatusTabOption>;
}

export function StatusTabs({ value, onValueChange, options }: Props) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList>
        {options.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value}>
            <span>{opt.label}</span>
            {opt.count != null && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {opt.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
