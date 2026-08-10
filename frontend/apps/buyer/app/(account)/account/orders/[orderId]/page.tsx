import type { Metadata } from "next";
import { OrderDetailClient } from "@/components/account/OrderDetailClient";

export const metadata: Metadata = { title: "Order Details" };

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderDetailClient orderId={orderId} />;
}
