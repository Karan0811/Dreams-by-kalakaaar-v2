import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@dbk/auth/server";
import { CheckoutClient } from "@/components/CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login?redirectTo=/checkout");
  }

  return (
    <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-400)] lg:px-[var(--space-600)]">
      <h1 className="mb-[var(--space-300)] font-serif text-[24px] text-text-primary">Checkout</h1>
      <CheckoutClient />
    </div>
  );
}
