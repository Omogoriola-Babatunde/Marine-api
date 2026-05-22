"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { QuoteForm } from "@/components/quote-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewQuoteDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create quote</DialogTitle>
          <DialogDescription>
            Premium is calculated from class × cargo value. A=10%, B=0.7%, C=0.5%.
          </DialogDescription>
        </DialogHeader>
        <QuoteForm />
      </DialogContent>
    </Dialog>
  );
}
