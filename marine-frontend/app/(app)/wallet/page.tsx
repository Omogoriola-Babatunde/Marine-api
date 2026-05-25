"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { NoPermissionCard } from "@/components/no-permission-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUsers } from "@/hooks/use-users";
import { useWalletBalance, useWalletTopup } from "@/hooks/use-wallet";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const topupSchema = z.object({
  userId: z.string().uuid("Must be a valid user UUID"),
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .refine((v) => Number.isFinite(v) && v > 0, "Amount must be > 0"),
  description: z.string().max(200).optional(),
});
type TopupSchema = z.infer<typeof topupSchema>;

function BalanceCard() {
  const { data, isLoading } = useWalletBalance();
  return (
    <Card>
      <CardHeader>
        <CardDescription>Available balance</CardDescription>
        <CardTitle className="text-4xl font-semibold tabular-nums">
          {isLoading || !data ? <Skeleton className="h-10 w-40" /> : usd.format(data.wallet)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Debited automatically when a policy you issued is approved.
      </CardContent>
    </Card>
  );
}

function AdminTopupCard() {
  const mutation = useWalletTopup();
  const { data: users, isLoading: usersLoading } = useUsers({ limit: 100 });
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopupSchema>({
    resolver: zodResolver(topupSchema),
    mode: "onBlur",
    defaultValues: { userId: "", amount: 0, description: "" },
  });

  const onSubmit = (values: TopupSchema) => {
    if (mutation.isPending) return;
    mutation.mutate(
      {
        userId: values.userId,
        amount: values.amount,
        ...(values.description ? { description: values.description } : {}),
      },
      { onSuccess: () => reset() }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top up a wallet</CardTitle>
        <CardDescription>Credit any user&apos;s wallet (ADMIN only).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="userId">User</FieldLabel>
              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mutation.isPending || usersLoading}
                  >
                    <SelectTrigger
                      id="userId"
                      aria-invalid={!!errors.userId}
                      className="w-full"
                    >
                      <SelectValue
                        placeholder={usersLoading ? "Loading users…" : "Pick a user"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.data.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.fullName} <span className="text-muted-foreground">({u.email})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.userId && (
                <FieldDescription className="text-destructive">
                  {errors.userId.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="amount">Amount (USD)</FieldLabel>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={0}
                disabled={mutation.isPending}
                aria-invalid={!!errors.amount}
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <FieldDescription className="text-destructive">
                  {errors.amount.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
              <Input
                id="description"
                disabled={mutation.isPending}
                maxLength={200}
                {...register("description")}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Topping up…" : "Top up"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export default function WalletPage() {
  const user = useAuthUser();
  const isAdmin = user?.role === "ADMIN";

  if (user && !isAdmin) {
    return (
      <>
        <SiteHeader title="Wallet" />
        <NoPermissionCard />
      </>
    );
  }

  return (
    <>
      <SiteHeader title="Wallet" />
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        <BalanceCard />
        <AdminTopupCard />
      </div>
    </>
  );
}
