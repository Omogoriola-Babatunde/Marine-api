"use client";

import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  pages: number;
  total: number;
  onPageChange: (next: number) => void;
}

export function DataTablePagination({ page, pages, total, onPageChange }: Props) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div>
        Page {page} of {pages} · {total} total
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
