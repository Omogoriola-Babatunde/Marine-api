"use client";

import { ShieldOffIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  title?: string;
  description?: string;
  homeHref?: string;
}

export function NoPermissionCard({
  title = "You don't have permission",
  description = "This page is restricted to administrators. If you think this is a mistake, ask an admin to update your role.",
  homeHref = "/quotes",
}: Props) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShieldOffIcon className="size-6 text-muted-foreground" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild variant="outline" size="sm">
            <Link href={homeHref}>Back to your quotes</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
