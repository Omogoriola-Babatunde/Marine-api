"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUpdateUserRates } from "@/hooks/use-update-user-rates";
import { type UserRatesSchema, userRatesSchema } from "@/lib/schemas";
import type { UserListItem } from "@/lib/types";

export function EditUserRatesDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateUserRates();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserRatesSchema>({
    resolver: zodResolver(userRatesSchema),
    mode: "onBlur",
    defaultValues: {
      classARatePct: user.classARate * 100,
      classBRatePct: user.classBRate * 100,
    },
  });

  // Reset when a different user is selected via the same dialog instance.
  useEffect(() => {
    reset({
      classARatePct: user.classARate * 100,
      classBRatePct: user.classBRate * 100,
    });
  }, [user.id, user.classARate, user.classBRate, reset]);

  const onSubmit = (values: UserRatesSchema) => {
    if (mutation.isPending) return;
    mutation.mutate(
      {
        id: user.id,
        rates: {
          classARate: values.classARatePct / 100,
          classBRate: values.classBRatePct / 100,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit rates — {user.fullName}</DialogTitle>
          <DialogDescription>
            Future quotes this user creates will use these per-class rates.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="rates-a">Class A rate (%)</FieldLabel>
              <Input
                id="rates-a"
                type="number"
                step="0.01"
                min={0}
                max={100}
                disabled={mutation.isPending}
                aria-invalid={!!errors.classARatePct}
                {...register("classARatePct", { valueAsNumber: true })}
              />
              {errors.classARatePct && (
                <FieldDescription className="text-destructive">
                  {errors.classARatePct.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="rates-b">Class B rate (%)</FieldLabel>
              <Input
                id="rates-b"
                type="number"
                step="0.01"
                min={0}
                max={100}
                disabled={mutation.isPending}
                aria-invalid={!!errors.classBRatePct}
                {...register("classBRatePct", { valueAsNumber: true })}
              />
              {errors.classBRatePct && (
                <FieldDescription className="text-destructive">
                  {errors.classBRatePct.message}
                </FieldDescription>
              )}
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save rates"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
