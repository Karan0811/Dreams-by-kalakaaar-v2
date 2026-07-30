import "server-only";
import type { CreatorPendingActions, CreatorPerformanceSummary } from "@dbk/types";
import { apiFetch } from "../client";

export async function fetchCreatorPendingActions(
  sessionUserId: string,
): Promise<{ data: CreatorPendingActions }> {
  return apiFetch<{ data: CreatorPendingActions }>("/creator/dashboard/pending-actions", {
    method: "GET",
    headers: { "X-User-Id": sessionUserId },
    cache: "no-store",
  });
}

export async function fetchCreatorPerformance(
  sessionUserId: string,
  periodLabel: string,
): Promise<{ data: CreatorPerformanceSummary }> {
  return apiFetch<{ data: CreatorPerformanceSummary }>(
    `/creator/dashboard/performance?period=${encodeURIComponent(periodLabel)}`,
    {
      method: "GET",
      headers: { "X-User-Id": sessionUserId },
      next: { revalidate: 300 },
    },
  );
}
