import type { Metadata } from "next";
import { getServerSession } from "@dbk/auth/server";
import { DashboardOrdersPreview } from "@/components/account/DashboardOrdersPreview";
import { Card } from "@dbk/ui";
import Link from "next/link";

export const metadata: Metadata = { title: "Your Account" };

/**
 * Sprint 02 — Orders is now a real feature (`modules/orders`), so this
 * dashboard's summary card queries the actual endpoint instead of always
 * rendering Sprint 01's static "no orders yet" placeholder. The full list
 * lives at `/account/orders`; this is just a preview.
 */
export default async function AccountDashboardPage() {
  const session = await getServerSession();

  return (
    <div className="flex flex-col gap-[var(--space-400)]">
      <div>
        <h1 className="font-serif text-[24px] text-text-primary">
          Welcome back{session?.displayName ? `, ${session.displayName}` : ""}
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">Here&apos;s a quick look at your account.</p>
      </div>

      <DashboardOrdersPreview />

      {/* BUG FIX (Phase 3): the Messages and Settings cards here linked to
          /account/messages and /account/settings, neither of which exists —
          see AccountNav.tsx's matching comment for why they're not being
          built out this phase. Replaced with an Addresses card, which is a
          real, working part of the MVP flow and previously had no shortcut
          here despite Wishlist getting one. */}
      <div className="grid gap-[var(--space-300)] sm:grid-cols-2">
        <Card>
          <p className="text-[14px] font-medium text-text-primary">Wishlist</p>
          <p className="mt-1 text-[13px] text-text-secondary">Save pieces you love for later.</p>
          <Link href="/account/wishlist" className="mt-2 inline-block text-[13px] font-medium text-text-link hover:underline">
            View wishlist
          </Link>
        </Card>
        <Card>
          <p className="text-[14px] font-medium text-text-primary">Addresses</p>
          <p className="mt-1 text-[13px] text-text-secondary">Manage your saved shipping addresses.</p>
          <Link href="/account/addresses" className="mt-2 inline-block text-[13px] font-medium text-text-link hover:underline">
            Manage addresses
          </Link>
        </Card>
      </div>
    </div>
  );
}
