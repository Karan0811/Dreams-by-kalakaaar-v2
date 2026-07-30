import { AccountNav } from "@/components/account/AccountNav";

/** 07-ui-screens-wireframes.md §5.1: account sidebar/tabs, stacked on mobile. */
export default function AccountSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-400)] lg:px-[var(--space-600)]">
      <div className="flex flex-col gap-[var(--space-400)] lg:flex-row">
        <AccountNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
