"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/use-register";
import { type SignupFormSchema, signupFormSchema } from "@/lib/schemas";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const mutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormSchema>({
    resolver: zodResolver(signupFormSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: SignupFormSchema) => {
    if (mutation.isPending) return;
    mutation.mutate({
      fullName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
      email: values.email,
      password: values.password,
    });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your name, email, and a password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} data-form-type="register">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="firstName">First name</FieldLabel>
                <Input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  disabled={mutation.isPending}
                  maxLength={50}
                  aria-invalid={!!errors.firstName}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <FieldDescription className="text-destructive">
                    {errors.firstName.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                <Input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  disabled={mutation.isPending}
                  maxLength={50}
                  aria-invalid={!!errors.lastName}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <FieldDescription className="text-destructive">
                    {errors.lastName.message}
                  </FieldDescription>
                )}
              </Field>
            </div>
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
              <FieldDescription>Used to sign in and for account recovery.</FieldDescription>
              {errors.email && (
                <FieldDescription className="text-destructive">
                  {errors.email.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={mutation.isPending}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldDescription>
                At least 8 characters, with upper &amp; lower case, a number, and a special character.
              </FieldDescription>
              {errors.password && (
                <FieldDescription className="text-destructive">
                  {errors.password.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
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
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Creating account…" : "Create Account"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
