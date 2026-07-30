import { redirect } from "next/navigation";
import { getServerSession } from "@dbk/auth/server";
import { SiteChrome } from "@/components/SiteChrome";

/**
 * Protected route group (11-frontend-architecture.md §12.2): re-validates
 * the session server-side on every request to this group, independent of
 * `middleware.ts`'s own check — defense in depth, since middleware alone
 * must never be the only gate in front of account data.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login?redirectTo=/account/dashboard");
  }

  return <SiteChrome>{children}</SiteChrome>;
}
