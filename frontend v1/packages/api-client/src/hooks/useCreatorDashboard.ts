"use client";

import { useQuery } from "@tanstack/react-query";
import type { CreatorPendingActions, CreatorPerformanceSummary } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { creatorDashboardKeys } from "../query-keys";

/** Surfaced first, above performance data, per the Pending Actions priority
 * rule (06-design-system.md §4.11, 07-ui-screens-wireframes.md §6.1). */
export function useCreatorPendingActions() {
  return useQuery({
    queryKey: creatorDashboardKeys.pendingActions(),
    queryFn: () =>
      browserFetch<{ data: CreatorPendingActions }>("/api/dashboard/pending-actions").then(
        (r) => r.data,
      ),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreatorPerformance(periodLabel: string) {
  return useQuery({
    queryKey: creatorDashboardKeys.performance(periodLabel),
    queryFn: () =>
      browserFetch<{ data: CreatorPerformanceSummary }>(
        `/api/dashboard/performance?period=${encodeURIComponent(periodLabel)}`,
      ).then((r) => r.data),
    staleTime: 5 * 60_000, // explicitly non-real-time, §9.10
  });
}
