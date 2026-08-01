"use client";

import * as React from "react";

export interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  /** Root margin passed to IntersectionObserver — defaults to firing
   * slightly before the sentinel is actually on-screen, so content is
   * ready by the time the user scrolls to it. */
  rootMargin?: string;
}

/**
 * Returns a ref to attach to a sentinel element at the end of a list.
 * Calls `onLoadMore` when that sentinel scrolls into view — the intended
 * pairing is TanStack Query's `useInfiniteQuery`, passing its
 * `fetchNextPage` as `onLoadMore` and `hasNextPage` as `hasMore` (see
 * `@dbk/utils`'s `hasNextPage()` if reading a raw `PaginatedResponse`
 * instead of `useInfiniteQuery`'s own flag).
 */
export function useInfiniteScroll<T extends HTMLElement>({
  onLoadMore,
  hasMore,
  isLoading = false,
  rootMargin = "200px",
}: UseInfiniteScrollOptions): React.RefObject<T | null> {
  const sentinelRef = React.useRef<T | null>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, rootMargin]);

  return sentinelRef;
}
