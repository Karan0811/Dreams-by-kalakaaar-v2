"use client";

import Link from "next/link";
import { AlertCircle, MessageCircleWarning, PackageOpen, Sparkles } from "lucide-react";
import { useCreatorPendingActions, useCreatorPerformance } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import { AnalyticsCard, Card, ErrorState, Skeleton } from "@dbk/ui";

const pendingConfig = [
  { key: "newOrders" as const, label: "New orders", icon: PackageOpen, href: "/dashboard/orders" },
  { key: "lowStockListings" as const, label: "Low stock listings", icon: AlertCircle, href: "/dashboard/inventory" },
  { key: "unreadMessages" as const, label: "Unread messages", icon: MessageCircleWarning, href: "/dashboard/messages" },
  { key: "pendingClarifications" as const, label: "Awaiting clarification", icon: Sparkles, href: "/dashboard/orders?status=awaiting_clarification" },
];

export function DashboardOverview() {
  const { data: pendingActions, isLoading: pendingLoading, isError: pendingIsError, refetch: refetchPending } = useCreatorPendingActions();
  const { data: performance, isLoading: performanceLoading, isError: performanceIsError, refetch: refetchPerformance } = useCreatorPerformance("last_30_days");

  const hasAnyPendingAction =
    pendingActions && Object.values(pendingActions).some((count) => count > 0);

  return (
    <div className="flex flex-col gap-[var(--space-400)]">
      <section aria-labelledby="pending-actions-heading">
        <h2 id="pending-actions-heading" className="mb-[var(--space-200)] text-[15px] font-medium text-text-primary">
          Pending Actions
        </h2>
        {pendingLoading ? (
          <div className="grid grid-cols-2 gap-[var(--space-200)] lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : pendingIsError ? (
          // BUG FIX (Phase 3): this previously fell through to the
          // "You're all caught up" empty state on a fetch failure (network
          // error, or the backend endpoint being unavailable), telling a
          // creator with real pending work that they had none. isError now
          // gets its own state, matching the ErrorState + refetch pattern
          // already used elsewhere (e.g. NotificationsClient.tsx).
          <ErrorState description="We couldn't load your pending actions." onRetry={() => refetchPending()} />
        ) : hasAnyPendingAction ? (
          <div className="grid grid-cols-2 gap-[var(--space-200)] lg:grid-cols-4">
            {pendingConfig.map(({ key, label, icon: Icon, href }) => {
              const count = pendingActions?.[key] ?? 0;
              if (count === 0) return null;
              return (
                <Link key={key} href={href}>
                  <Card className="flex items-center gap-3 hover:border-border-strong">
                    <Icon className="size-5 text-brand-primary" aria-hidden />
                    <div>
                      {/* Count is announced via text, never a colored dot alone (§6.1 a11y note). */}
                      <p className="text-[18px] font-semibold tabular-nums text-text-primary">{count}</p>
                      <p className="text-[12px] text-text-secondary">{label}</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="text-[14px] text-text-secondary">You&apos;re all caught up — no pending actions.</Card>
        )}
      </section>

      <section aria-labelledby="performance-heading">
        <h2 id="performance-heading" className="mb-[var(--space-200)] text-[15px] font-medium text-text-primary">
          Last 30 Days
        </h2>
        {performanceLoading ? (
          <div className="grid grid-cols-2 gap-[var(--space-200)] lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : performanceIsError ? (
          // Same fix as above: don't tell a creator "no sales data yet"
          // when the real story is that the request failed.
          <ErrorState description="We couldn't load your performance data." onRetry={() => refetchPerformance()} />
        ) : performance ? (
          <div className="grid grid-cols-2 gap-[var(--space-200)] lg:grid-cols-4">
            <AnalyticsCard label="Revenue" value={formatMoney(performance.revenue)} />
            <AnalyticsCard label="Orders" value={String(performance.ordersCount)} />
            <AnalyticsCard label="Conversion Rate" value={`${(performance.conversionRate * 100).toFixed(1)}%`} />
            <AnalyticsCard
              label="Average Rating"
              value={performance.averageRating ? performance.averageRating.toFixed(1) : "—"}
            />
          </div>
        ) : (
          // §6.1 CDASH-01: new-creator guided zero-state rather than a blank/broken widget.
          <Card className="flex flex-col items-center gap-2 py-[var(--space-800)] text-center">
            <p className="text-[14px] font-medium text-text-primary">No sales data yet</p>
            <p className="text-[13px] text-text-secondary">
              Once your first order comes in, your performance will show up here.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
