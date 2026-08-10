"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useMyOrder, useCancelOrder } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import type { RealOrderStatus } from "@dbk/types";
import { Badge, Button, Card, ConfirmDialog, ErrorState, Skeleton, toast } from "@dbk/ui";

const STATUS_BADGE: Record<RealOrderStatus, { label: string; variant: "neutral" | "success" | "warning" | "error" | "info" }> = {
  PENDING: { label: "Pending", variant: "neutral" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  PROCESSING: { label: "Processing", variant: "info" },
  SHIPPED: { label: "Shipped", variant: "warning" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "error" },
};

const CANCELLABLE: RealOrderStatus[] = ["PENDING", "CONFIRMED"];

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const { data: order, isLoading, isError, refetch } = useMyOrder(orderId);
  const cancelOrder = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState description="We couldn't load this order." onRetry={() => refetch()} />;
  }

  async function handleCancel() {
    try {
      await cancelOrder.mutateAsync({ orderId });
      toast.success("Order cancelled");
    } catch {
      toast.error("Couldn't cancel this order. Please try again.");
    } finally {
      setConfirmCancel(false);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <Link href="/account/orders" className="flex items-center gap-1 text-[13px] font-medium text-text-link hover:underline">
        <ArrowLeft className="size-3" aria-hidden /> Back to orders
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[22px] text-text-primary">{order.orderNumber}</h1>
          <p className="text-[13px] text-text-secondary">
            Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
        </div>
        <Badge variant={STATUS_BADGE[order.status].variant}>{STATUS_BADGE[order.status].label}</Badge>
      </div>

      <Card>
        <h2 className="text-[14px] font-medium text-text-primary">Items</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-[14px]">
              <div>
                <p className="text-text-primary">{item.titleSnapshot}</p>
                <p className="text-[13px] text-text-secondary">Qty {item.quantity}</p>
              </div>
              <p className="tabular-nums text-text-primary">
                {formatMoney({ amountMinor: item.lineTotalAmount, currency: order.currency as "INR" })}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[14px] font-medium">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {formatMoney({ amountMinor: order.subtotalAmount, currency: order.currency as "INR" })}
          </span>
        </div>
      </Card>

      <Card>
        <h2 className="text-[14px] font-medium text-text-primary">Shipping address</h2>
        <p className="mt-1 text-[13px] text-text-secondary">{order.shippingRecipientName}</p>
        <p className="text-[13px] text-text-secondary">
          {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}, {order.shippingCity}, {order.shippingState}{" "}
          {order.shippingPostalCode}
        </p>
      </Card>

      <Card>
        <h2 className="text-[14px] font-medium text-text-primary">Status history</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {order.statusHistory.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between text-[13px] text-text-secondary">
              <span>{entry.toStatus}</span>
              <span>{new Date(entry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
            </li>
          ))}
        </ul>
      </Card>

      {order.cancellationReason ? (
        <Card className="border-error/30 bg-error-background">
          <p className="text-[13px] text-text-secondary">Cancellation reason: {order.cancellationReason}</p>
        </Card>
      ) : null}

      {CANCELLABLE.includes(order.status) ? (
        <Button variant="danger" className="self-start" onClick={() => setConfirmCancel(true)}>
          Cancel Order
        </Button>
      ) : null}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this order?"
        description="This can't be undone."
        destructive
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        isConfirming={cancelOrder.isPending}
        onConfirm={handleCancel}
      />
    </div>
  );
}
