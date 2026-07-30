import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background-subtle px-[var(--space-200)] py-[var(--space-800)]">
      <Link href="/" className="mb-[var(--space-600)] font-serif text-[22px] text-text-primary">
        Dreams by Kalakaaar — Creator Studio
      </Link>
      <div className="w-full max-w-[400px] rounded-[var(--radius-400)] border border-border bg-surface p-[var(--space-400)] shadow-md">
        {children}
      </div>
    </div>
  );
}
