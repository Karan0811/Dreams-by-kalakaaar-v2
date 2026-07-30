"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@dbk/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production this reports to Sentry (18-observability-monitoring.md);
    // logged here so a failure is never silently swallowed during development.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-[var(--space-200)] text-center">
      <AlertTriangle className="size-10 text-warning" aria-hidden />
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">Something went wrong</h1>
        <p className="mt-1 max-w-sm text-[14px] text-text-secondary">
          We hit a snag loading this page. You can try again, or head back home.
        </p>
        {error.digest ? (
          <p className="mt-2 text-[12px] text-text-placeholder">Reference: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="secondary" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
