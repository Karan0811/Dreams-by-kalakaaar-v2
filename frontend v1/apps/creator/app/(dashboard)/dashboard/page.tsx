import type { Metadata } from "next";
import { getServerSession } from "@dbk/auth/server";
import { DashboardOverview } from "@/components/DashboardOverview";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const session = await getServerSession();

  return (
    <div className="mx-auto max-w-(--container-content-xl)">
      <h1 className="mb-[var(--space-300)] font-serif text-[24px] text-text-primary">
        Welcome back{session?.displayName ? `, ${session.displayName}` : ""}
      </h1>
      <DashboardOverview />
    </div>
  );
}
