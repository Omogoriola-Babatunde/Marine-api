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
import { Input } from "@/components/ui/input";
import { useCreateQuote } from "@/hooks/use-create-quote";
import { type CreateQuoteSchema, createQuoteSchema } from "@/lib/schemas";

const CLASS_OPTIONS = [
  { value: "A", label: "A — Premium (10%)" },
  { value: "B", label: "B — Standard (0.7%)" },
  { value: "C", label: "C — Basic (0.5%)" },
] as const;

export function QuoteForm() {
  const mutation = useCreateQuote();
  const form = useForm<CreateQuoteSchema>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      classType: "B",
      cargoType: "",
      cargoValue: 0,
      origin: "",
      destination: "",
    },
  });

  const onSubmit = (values: CreateQuoteSchema) => {
    if (mutation.isPending) return;
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="classType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={mutation.isPending}
                >
                  {CLASS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cargoType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo type</FormLabel>
              <FormControl>
                <Input {...field} disabled={mutation.isPending} maxLength={100} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cargoValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo value (USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  disabled={mutation.isPending}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origin</FormLabel>
              <FormControl>
                <Input {...field} disabled={mutation.isPending} maxLength={100} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <Input {...field} disabled={mutation.isPending} maxLength={100} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating quote…" : "Get quote"}
        </Button>
      </form>
    </Form>
  );
}
