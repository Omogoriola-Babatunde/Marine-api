"use client";

import { MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeleteQuoteDialog } from "@/components/delete-quote-action";
import { EditQuoteDialog } from "@/components/edit-quote-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { Quote } from "@/lib/types";

export function QuoteRowActions({ quote }: { quote: Quote }) {
  const me = useAuthUser();
  const isAdmin = me?.role === "ADMIN";
  const isGenerated = quote.status === "GENERATED";
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
            <DropdownMenuItem asChild>
              <Link href={`/quotes/${quote.id}`}>Open</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!isGenerated}
              onSelect={() => setEditOpen(true)}
            >
              Edit
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!isGenerated}
                  onSelect={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditQuoteDialog quote={quote} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteQuoteDialog
        quoteId={quote.id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
