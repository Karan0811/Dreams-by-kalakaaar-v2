import { redirect } from "next/navigation";
import { getServerSession } from "@dbk/auth/server";
import { DashboardChrome } from "@/components/DashboardChrome";

/**
 * Authoritative, server-side re-check (11-frontend-architecture.md §12.2):
 * requires both a valid session *and* the `creator` role, independent of
 * whatever `middleware.ts` already decided. A signed-in Buyer without a
 * Creator profile is redirected to apply, not shown a broken dashboard.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?redirectTo=/dashboard");
  }
  if (!session.roles.includes("creator")) {
    redirect("/become-a-creator");
  }

  return <DashboardChrome>{children}</DashboardChrome>;
}
