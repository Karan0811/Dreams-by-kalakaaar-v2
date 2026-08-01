"use client";

import * as React from "react";
import { clampPage } from "@dbk/utils";

export interface UsePaginationResult {
  page: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * Local page-number state, clamped to `[1, totalPages]` via `@dbk/utils`'s
 * `clampPage` (so a filter change that shrinks the result set can't leave
 * the UI pointing at a page that no longer exists). Pairs with the
 * `Pagination` UI component and a numbered `PagedResponse` query — for the
 * buyer storefront's cursor-based "Load more" pattern, use TanStack Query's
 * `useInfiniteQuery` directly (see `useInfiniteScroll` for the scroll
 * trigger), not this hook.
 */
export function usePagination(totalPages: number, initialPage = 1): UsePaginationResult {
  const [page, setPage] = React.useState(() => clampPage(initialPage, totalPages));

  React.useEffect(() => {
    setPage((current) => clampPage(current, totalPages));
  }, [totalPages]);

  const goToPage = React.useCallback(
    (target: number) => setPage(clampPage(target, totalPages)),
    [totalPages],
  );

  return {
    page,
    totalPages,
    goToPage,
    nextPage: React.useCallback(() => setPage((p) => clampPage(p + 1, totalPages)), [totalPages]),
    previousPage: React.useCallback(() => setPage((p) => clampPage(p - 1, totalPages)), [totalPages]),
    canGoNext: page < totalPages,
    canGoPrevious: page > 1,
  };
}
