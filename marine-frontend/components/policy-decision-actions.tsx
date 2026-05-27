"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApprovePolicy, useRejectPolicy } from "@/hooks/use-policy-mutations";

export function ApprovePolicyDialog({
  policyId,
  open,
  onOpenChange,
}: {
  policyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useApprovePolicy();

  return (
    <Dialog open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve this policy?</DialogTitle>
          <DialogDescription>
            The issuer&apos;s wallet will be debited for the quote&apos;s premium and a
            certificate PDF will be generated. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(policyId, { onSuccess: () => onOpenChange(false) })
            }
          >
            {mutation.isPending ? "Approving…" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectPolicyDialog({
  policyId,
  open,
  onOpenChange,
}: {
  policyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useRejectPolicy();

  return (
    <Dialog open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this policy?</DialogTitle>
          <DialogDescription>
            The policy will be marked as REJECTED. The wallet is not debited.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(policyId, { onSuccess: () => onOpenChange(false) })
            }
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
