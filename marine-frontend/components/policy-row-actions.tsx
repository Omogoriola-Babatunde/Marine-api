"use client";

import { MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { useCertificateUrl } from "@/hooks/use-certificate";
import type { Policy } from "@/lib/types";

export function PolicyRowActions({ policy }: { policy: Policy }) {
  const me = useAuthUser();
  const isAdmin = me?.role === "ADMIN";
  const isPending = policy.status === "PENDING_APPROVAL";
  const isApproved = policy.status === "APPROVED";
  const [menuOpen, setMenuOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Only fetch the cert blob when the menu is open AND the policy is
  // APPROVED — avoids prefetching PDFs for every visible row.
  const { url, isLoading: certLoading } = useCertificateUrl(
    menuOpen && isApproved ? policy.policyNumber : undefined
  );

  return (
    <>
      <div className="flex justify-end">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/policies/${policy.id}`}>View</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
