import Link from "next/link";
import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { getServerSession } from "@dbk/auth/server";
import { Button, Card } from "@dbk/ui";

export const metadata: Metadata = { title: "Your Account" };

/**
 * Sprint 1 delivers this as a dashboard *shell*: layout, navigation, and the
 * correctly-designed empty state. The Orders list/detail feature itself
 * (backed by a real orders endpoint) is out of scope for this sprint per the
 * brief, so this intentionally shows the "no orders yet" state from
 * §5.1 rather than fabricating order data.
 */
export default async function AccountDashboardPage() {
  const session = await getServerSession();

  return (
    <div className="flex flex-col gap-[var(--space-400)]">
      <div>
        <h1 className="font-serif text-[24px] text-text-primary">
          Welcome back{session?.displayName ? `, ${session.displayName}` : ""}
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">Here's a quick look at your account.</p>
      </div>

      <Card className="flex flex-col items-center gap-3 py-[var(--space-800)] text-center">
        <PackageSearch className="size-10 text-text-secondary" aria-hidden />
        <div>
          <p className="text-[16px] font-medium text-text-primary">No orders yet</p>
          <p className="mt-1 text-[14px] text-text-secondary">
            When you place an order, you'll be able to track it here.
          </p>
        </div>
        <Button asChild>
          <Link href="/products">Start Browsing</Link>
        </Button>
      </Card>

      <div className="grid gap-[var(--space-300)] sm:grid-cols-3">
        <Card>
          <p className="text-[14px] font-medium text-text-primary">Wishlist</p>
          <p className="mt-1 text-[13px] text-text-secondary">Save pieces you love for later.</p>
          <Link href="/account/wishlist" className="mt-2 inline-block text-[13px] font-medium text-text-link hover:underline">
            View wishlist
          </Link>
        </Card>
        <Card>
          <p className="text-[14px] font-medium text-text-primary">Messages</p>
          <p className="mt-1 text-[13px] text-text-secondary">Order-related conversations with creators.</p>
          <Link href="/account/messages" className="mt-2 inline-block text-[13px] font-medium text-text-link hover:underline">
            View messages
          </Link>
        </Card>
        <Card>
          <p className="text-[14px] font-medium text-text-primary">Settings</p>
          <p className="mt-1 text-[13px] text-text-secondary">Manage your profile and preferences.</p>
          <Link href="/account/settings" className="mt-2 inline-block text-[13px] font-medium text-text-link hover:underline">
            Go to settings
          </Link>
        </Card>
      </div>
    </div>
  );
}
