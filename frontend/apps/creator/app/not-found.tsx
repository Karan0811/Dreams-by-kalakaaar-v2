import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@dbk/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-[var(--space-200)] text-center">
      <Compass className="size-10 text-text-secondary" aria-hidden />
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">We couldn&apos;t find that page</h1>
        <p className="mt-1 max-w-sm text-[14px] text-text-secondary">
          It may have moved, or you may not have access to it.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
