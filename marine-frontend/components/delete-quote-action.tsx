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
import { useDeleteQuote } from "@/hooks/use-quote-mutations";

export function DeleteQuoteDialog({
  quoteId,
  open,
  onOpenChange,
}: {
  quoteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useDeleteQuote();

  return (
    <Dialog open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this quote?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Quotes that have already been issued as policies
            cannot be deleted.
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
              mutation.mutate(quoteId, { onSuccess: () => onOpenChange(false) })
            }
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
