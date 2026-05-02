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
import { useIssuePolicy } from "@/hooks/use-issue-policy";
import { type IssuePolicySchema, issuePolicySchema } from "@/lib/schemas";
import type { IssuePolicyResponse } from "@/lib/types";

interface Props {
  quoteId: string;
  onSuccess: (response: IssuePolicyResponse) => void;
}

export function PolicyForm({ quoteId, onSuccess }: Props) {
  const mutation = useIssuePolicy();
  const form = useForm<IssuePolicySchema>({
    resolver: zodResolver(issuePolicySchema),
    defaultValues: { quoteId, customername: "" },
  });

  const onSubmit = (values: IssuePolicySchema) => {
    if (mutation.isPending) return;
    mutation.mutate(values, {
      onSuccess,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customername"
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
