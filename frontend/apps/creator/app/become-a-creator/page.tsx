import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@dbk/ui";

export const metadata: Metadata = { title: "Become a Creator" };

/**
 * The full Creator Registration application form
 * (07-ui-screens-wireframes.md §4.9) is a Sprint 2+ feature; this page is
 * the honest, correctly-scoped landing/informational stub that Sprint 1's
 * dashboard-access redirect points to, per the sprint brief's "Creator
 * Dashboard shell" scope.
 */
export default function BecomeACreatorPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-[var(--space-200)] py-[var(--space-800)] text-center">
      <h1 className="font-serif text-[26px] text-text-primary">Sell your craft on Dreams by Kalakaaar</h1>
      <p className="max-w-md text-[14px] text-text-secondary">
        Creator applications open soon. In the meantime, sign in if you already have a verified
        storefront.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Creator Sign In</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={process.env.NEXT_PUBLIC_BUYER_APP_URL ?? "http://localhost:3000"}>
            Back to Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
