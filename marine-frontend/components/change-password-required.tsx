"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuthUser } from "@/hooks/use-auth-user";
import { updateCurrentUser } from "@/lib/api-client";
import { getToken, setStoredUser } from "@/lib/auth";
import { type ForceChangePasswordSchema, forceChangePasswordSchema } from "@/lib/schemas";
import type { AuthUser } from "@/lib/types";

export function ChangePasswordRequired() {
  const me = useAuthUser();
  const router = useRouter();

  // Redirect away if the user shouldn't be here. Belt-and-braces alongside RequireAuth
  // (which only runs inside the (app) shell — this page is outside it).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    if (me && !me.mustChangePassword) {
      router.replace("/dashboard");
    }
  }, [me, router]);

  const mutation = useMutation<AuthUser, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => {
      setStoredUser(user);
      toast.success("Password updated");
      router.replace("/quotes");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForceChangePasswordSchema>({
    resolver: zodResolver(forceChangePasswordSchema),
    mode: "onBlur",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (values: ForceChangePasswordSchema) => {
    if (mutation.isPending) return;
    mutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          Welcome{me?.fullName ? `, ${me.fullName}` : ""}. Before you continue, please replace the
          temporary password your administrator gave you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="currentPassword">Current (temporary) password</FieldLabel>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                disabled={mutation.isPending}
                aria-invalid={!!errors.currentPassword}
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <FieldDescription className="text-destructive">
                  {errors.currentPassword.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                disabled={mutation.isPending}
                aria-invalid={!!errors.newPassword}
                {...register("newPassword")}
              />
              <FieldDescription>
                At least 8 characters, with upper &amp; lower case, a number, and a special
                character.
              </FieldDescription>
              {errors.newPassword && (
                <FieldDescription className="text-destructive">
                  {errors.newPassword.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                disabled={mutation.isPending}
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <FieldDescription className="text-destructive">
                  {errors.confirmPassword.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Set new password"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
