"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { type ForgotPasswordSchema, forgotPasswordSchema } from "@/lib/schemas";

export function ForgotPasswordForm({ ...props }: React.ComponentProps<typeof Card>) {
  const mutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordSchema) => {
    if (mutation.isPending) return;
    mutation.mutate(values);
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send instructions if it&apos;s on file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mutation.isSuccess ? (
          <FieldGroup>
            <FieldDescription>
              If an account exists for that email, a reset link has been sent.
            </FieldDescription>
            <Field>
              <Link
                href="/login"
                className="text-center text-sm underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </Field>
          </FieldGroup>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
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
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Sending…" : "Send reset link"}
                </Button>
                <FieldDescription className="text-center">
                  Remembered it?{" "}
                  <Link href="/login" className="underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
