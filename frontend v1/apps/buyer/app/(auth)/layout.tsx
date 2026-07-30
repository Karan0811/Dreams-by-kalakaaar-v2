import Link from "next/link";

/**
 * Auth screens intentionally omit the Navbar/Footer chrome
 * (07-ui-screens-wireframes.md §4: a focused, single-task layout keeps
 * attention on completing sign-in/sign-up rather than inviting browsing).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background-subtle px-[var(--space-200)] py-[var(--space-800)]">
      <Link href="/" className="mb-[var(--space-600)] font-serif text-[22px] text-text-primary">
        Dreams by Kalakaaar
      </Link>
      <div className="w-full max-w-[400px] rounded-[var(--radius-400)] border border-border bg-surface p-[var(--space-400)] shadow-md">
        {children}
      </div>
    </div>
  );
}
