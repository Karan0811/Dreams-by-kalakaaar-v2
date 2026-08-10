"use client";

import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { useMyOrders } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import { Button, Card, Skeleton } from "@dbk/ui";

export function DashboardOrdersPreview() {
  const { data: orders, isLoading } = useMyOrders({ limit: 3 });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!orders || orders.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-[var(--space-800)] text-center">
        <PackageSearch className="size-10 text-text-secondary" aria-hidden />
        <div>
          <p className="text-[16px] font-medium text-text-primary">No orders yet</p>
          <p className="mt-1 text-[14px] text-text-secondary">
            When you place an order, you&apos;ll be able to track it here.
          </p>
        </div>
        <Button asChild>
          <Link href="/products">Start Browsing</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-medium text-text-primary">Recent orders</h2>
        <Link href="/account/orders" className="text-[13px] font-medium text-text-link hover:underline">
          View all
        </Link>
      </div>
      <ul className="mt-2 flex flex-col gap-2">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between text-[14px] text-text-primary hover:text-text-link"
            >
              <span>{order.orderNumber}</span>
              <span className="tabular-nums">
                {formatMoney({ amountMinor: order.subtotalAmount, currency: "INR" })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
