"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIssuePolicy } from "@/hooks/use-issue-policy";
import { type IssuePolicySchema, issuePolicySchema } from "@/lib/schemas";

const MODES = [
  { value: "SEA", label: "Sea" },
  { value: "AIR", label: "Air" },
] as const;

const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
  { value: "EUR", label: "EUR" },
] as const;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

export function PolicyForm({ quoteId }: { quoteId: string }) {
  const mutation = useIssuePolicy();
  const form = useForm<IssuePolicySchema>({
    resolver: zodResolver(issuePolicySchema),
    mode: "onTouched",
    defaultValues: {
      quoteId,
      customerName: "",
      proformaInvoice: "",
      startDate: "",
      endDate: "",
    },
  });

  const onSubmit = (values: IssuePolicySchema) => {
    if (mutation.isPending) return;
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4">
          <SectionHeading>Customer</SectionHeading>
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={mutation.isPending} maxLength={100} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <SectionHeading>Shipment</SectionHeading>
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mode</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || undefined)}
                  disabled={mutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={mutation.isPending}
                      aria-invalid={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>End date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={mutation.isPending}
                      aria-invalid={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>Invoice</SectionHeading>
          <FormField
            control={form.control}
            name="proformaInvoice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proforma invoice #</FormLabel>
                <FormControl>
                  <Input {...field} disabled={mutation.isPending} maxLength={200} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || undefined)}
                    disabled={mutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      disabled={mutation.isPending}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const v = e.target.valueAsNumber;
                        field.onChange(Number.isFinite(v) ? v : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exchangeRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      min={0}
                      disabled={mutation.isPending}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const v = e.target.valueAsNumber;
                        field.onChange(Number.isFinite(v) ? v : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="text-xs text-muted-foreground">
          Issuing against quote <code>{quoteId}</code>
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Issuing policy…" : "Issue policy"}
        </Button>
      </form>
    </Form>
  );
}
