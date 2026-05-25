"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser } from "@/hooks/use-create-user";
import { type CreateUserSchema, createUserSchema } from "@/lib/schemas";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["USER", "STAFF", "ADMIN"];

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const mutation = useCreateUser();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "USER",
      classARatePct: 10,
      classBRatePct: 0.7,
    },
  });

  const role = watch("role");

  const onSubmit = (values: CreateUserSchema) => {
    if (mutation.isPending) return;
    const { classARatePct, classBRatePct, ...rest } = values;
    mutation.mutate(
      {
        ...rest,
        classARate: classARatePct / 100,
        classBRate: classBRatePct / 100,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (mutation.isPending) return;
        if (!o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Provision a new account. The user can change their password later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                disabled={mutation.isPending}
                maxLength={100}
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
              />
              {errors.fullName && (
                <FieldDescription className="text-destructive">
                  {errors.fullName.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="m@example.com"
                disabled={mutation.isPending}
                maxLength={200}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <FieldDescription className="text-destructive">
                  {errors.email.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Initial password</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                disabled={mutation.isPending}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldDescription>
                At least 8 characters, with upper &amp; lower case, a number, and a special
                character.
              </FieldDescription>
              {errors.password && (
                <FieldDescription className="text-destructive">
                  {errors.password.message}
                </FieldDescription>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="classARatePct">Class A rate (%)</FieldLabel>
                <Input
                  id="classARatePct"
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
                <FieldLabel htmlFor="classBRatePct">Class B rate (%)</FieldLabel>
                <Input
                  id="classBRatePct"
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
            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(v) => setValue("role", v as UserRole, { shouldValidate: true })}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="role" className="w-full" aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <FieldDescription className="text-destructive">
                  {errors.role.message}
                </FieldDescription>
              )}
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating…" : "Create user"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
