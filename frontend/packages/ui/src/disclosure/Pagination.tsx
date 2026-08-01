"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@dbk/utils";
import { Button } from "../primitives/Button";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Numbered page navigation, for the PagedResponse envelope (§2.6) used by
 * Admin/Internal/Creator management tables. The buyer storefront's infinite
 * Product list uses cursor pagination (§2.7) via `fetchNextPage` instead —
 * intentionally a different UX for a different data shape, not something
 * this component should also try to render.
 */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>

      {pages.map((entry, index) =>
        entry === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="flex size-8 items-center justify-center text-text-secondary">
            <MoreHorizontal className="size-4" aria-hidden />
          </span>
        ) : (
          <Button
            key={entry}
            variant={entry === page ? "primary" : "tertiary"}
            size="sm"
            aria-current={entry === page ? "page" : undefined}
            onClick={() => onPageChange(entry)}
            className="min-w-8 px-0"
          >
            {entry}
          </Button>
        ),
      )}

      <Button
        variant="tertiary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  );
}

function getVisiblePages(page: number, totalPages: number): (number | "ellipsis")[] {
  const delta = 1;
  const range: (number | "ellipsis")[] = [];
  const rangeStart = Math.max(2, page - delta);
  const rangeEnd = Math.min(totalPages - 1, page + delta);

  range.push(1);
  if (rangeStart > 2) range.push("ellipsis");
  for (let i = rangeStart; i <= rangeEnd; i += 1) range.push(i);
  if (rangeEnd < totalPages - 1) range.push("ellipsis");
  if (totalPages > 1) range.push(totalPages);

  return range;
}
