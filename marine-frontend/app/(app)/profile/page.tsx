"use client";

import { ChangePasswordForm } from "@/components/change-password-form";
import { ProfileInfoForm } from "@/components/profile-info-form";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import type { UserRole } from "@/lib/types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const roleVariant: Record<UserRole, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  STAFF: "secondary",
  USER: "outline",
};

function AccountSummaryCard() {
  const { data: user, isLoading } = useProfile();

  if (isLoading || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Read-only details about your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="mt-1">
              <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Wallet</dt>
            <dd className="mt-1 font-medium tabular-nums">{usd.format(user.wallet)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="mt-1">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { data: user, isLoading } = useProfile();

  return (
    <>
      <SiteHeader title="Profile" />
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        <AccountSummaryCard />
        {isLoading || !user ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ProfileInfoForm user={user} />
        )}
        <ChangePasswordForm />
      </div>
    </>
  );
}
