import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-400)] lg:px-[var(--space-600)]">
      <h1 className="mb-[var(--space-300)] font-serif text-[24px] text-text-primary">Your Cart</h1>
      <CartView />
    </div>
  );
}
