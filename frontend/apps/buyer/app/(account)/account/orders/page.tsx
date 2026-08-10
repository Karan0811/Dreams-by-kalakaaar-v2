import type { Metadata } from "next";
import { OrdersListClient } from "@/components/account/OrdersListClient";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return <OrdersListClient />;
}
