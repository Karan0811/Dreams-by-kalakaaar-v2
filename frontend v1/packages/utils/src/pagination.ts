import type { PagedResponse, PaginatedResponse } from "@dbk/types";

/**
 * Helpers over the two pagination envelope shapes defined in
 * @dbk/types/shared (09-api-architecture.md §2.6-2.7). These read an
 * envelope; they never construct one — that stays server-side.
 */

/** Whether a cursor-paginated response has another page to fetch. Mirrors
 * `response.pagination.hasMore` directly — exists so call sites don't need
 * to know the envelope's internal shape, just "is there more". */
export function hasNextPage<T>(response: PaginatedResponse<T>): boolean {
  return response.pagination.hasMore && response.pagination.nextCursor !== null;
}

/** Flattens the `data` arrays across a list of cursor-paginated pages, e.g.
 * TanStack Query's `useInfiniteQuery` `data.pages`. */
export function flattenPages<T>(pages: PaginatedResponse<T>[]): T[] {
  return pages.flatMap((page) => page.data);
}

/** Whether a numbered-page response is on its last page. */
export function isLastPage<T>(response: PagedResponse<T>): boolean {
  return response.pagination.page >= response.pagination.totalPages;
}

/** Clamps a requested page number into the valid [1, totalPages] range —
 * guards against a stale "page=12" query param after a filter change
 * shrinks the result set to 3 pages. */
export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}
