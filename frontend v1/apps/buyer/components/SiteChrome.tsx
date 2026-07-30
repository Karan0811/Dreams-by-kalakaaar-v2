"use client";

import { useCart } from "@dbk/api-client";
import { useSession } from "@dbk/auth";
import { Navbar, Footer, BottomNav } from "@dbk/ui";

/**
 * Wraps the shared Navbar/Footer/BottomNav from @dbk/ui with this app's live
 * data: cart contents (TanStack Query, always server state per
 * 11-frontend-architecture.md §9.1) and session identity (Better Auth's
 * `useSession`, §12.1). Kept as a small Client Component boundary so the
 * page content it wraps can remain Server Components.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const { data: cart } = useCart();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        cartCount={cart?.itemCount ?? 0}
        account={{ isAuthenticated: Boolean(session?.user), displayName: session?.user?.name }}
      />
      <main id="main-content" className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNav cartCount={cart?.itemCount ?? 0} />
    </div>
  );
}
