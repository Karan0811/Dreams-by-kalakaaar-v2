"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useMyOrders } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import type { RealOrderStatus } from "@dbk/types";
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from "@dbk/ui";

const STATUS_BADGE: Record<RealOrderStatus, { label: string; variant: "neutral" | "success" | "warning" | "error" | "info" }> = {
  PENDING: { label: "Pending", variant: "neutral" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  PROCESSING: { label: "Processing", variant: "info" },
  SHIPPED: { label: "Shipped", variant: "warning" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "error" },
};

export function OrdersListClient() {
  const { data: orders, isLoading, isError, refetch } = useMyOrders();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="We couldn't load your orders." onRetry={() => refetch()} />;
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place an order, you'll be able to track it here."
        action={
          <Button asChild>
            <Link href="/products">Start Browsing</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <h1 className="font-serif text-[22px] text-text-primary">Orders</h1>
      <ul className="flex flex-col gap-2">
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/account/orders/${order.id}`}>
              <Card className="flex items-center justify-between gap-3 transition-colors hover:border-brand-primary">
                <div>
                  <p className="text-[14px] font-medium text-text-primary">{order.orderNumber}</p>
                  <p className="text-[13px] text-text-secondary">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_BADGE[order.status].variant}>{STATUS_BADGE[order.status].label}</Badge>
                  <p className="font-sans text-[14px] font-semibold tabular-nums text-text-primary">
                    {formatMoney({ amountMinor: order.subtotalAmount, currency: "INR" })}
                  </p>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
