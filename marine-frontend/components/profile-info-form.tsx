"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { AuthUser } from "@/lib/types";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Enter a valid email").max(200),
});
type FormSchema = z.infer<typeof schema>;

export function ProfileInfoForm({ user }: { user: AuthUser }) {
  const mutation = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormSchema>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { fullName: user.fullName, email: user.email },
  });

  useEffect(() => {
    reset({ fullName: user.fullName, email: user.email });
  }, [user.fullName, user.email, reset]);

  const onSubmit = (values: FormSchema) => {
    if (mutation.isPending) return;
    const payload: { fullName?: string; email?: string } = {};
    if (values.fullName !== user.fullName) payload.fullName = values.fullName;
    if (values.email !== user.email) payload.email = values.email;
    if (Object.keys(payload).length === 0) return;
    mutation.mutate(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update the name and email on your account.</CardDescription>
      </CardHeader>
      <CardContent>
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
              <Button type="submit" disabled={mutation.isPending || !isDirty}>
                {mutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
