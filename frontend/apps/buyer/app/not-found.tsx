import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@dbk/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-[var(--space-200)] text-center">
      <Compass className="size-10 text-text-secondary" aria-hidden />
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">We couldn&apos;t find that page</h1>
        <p className="mt-1 max-w-sm text-[14px] text-text-secondary">
          The page you&apos;re looking for may have moved or no longer exists.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    </div>
  );
}
