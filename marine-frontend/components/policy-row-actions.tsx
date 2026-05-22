"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { useCertificateUrl } from "@/hooks/use-certificate";
import {
  ApprovePolicyDialog,
  RejectPolicyDialog,
} from "@/components/policy-decision-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { Policy } from "@/lib/types";

export function PolicyRowActions({ policy }: { policy: Policy }) {
  const me = useAuthUser();
  const isAdmin = me?.role === "ADMIN";
  const isPending = policy.status === "PENDING_APPROVAL";
  const isApproved = policy.status === "APPROVED";
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { url, isLoading: certLoading } = useCertificateUrl(
    isApproved ? policy.policyNumber : undefined
  );

  return (
    <>
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAdmin && (
              <>
                <DropdownMenuItem
                  disabled={!isPending}
                  onSelect={() => setApproveOpen(true)}
                >
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!isPending}
                  onSelect={() => setRejectOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Reject
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem disabled={!isApproved || !url || certLoading} asChild={!!url}>
              {url ? (
                <a
                  href={url}
                  download={`certificate-${policy.policyNumber}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download certificate
                </a>
              ) : (
                <span>{certLoading ? "Loading certificate…" : "Download certificate"}</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ApprovePolicyDialog
        policyId={policy.id}
        open={approveOpen}
        onOpenChange={setApproveOpen}
      />
      <RejectPolicyDialog
        policyId={policy.id}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />
    </>
  );
}
