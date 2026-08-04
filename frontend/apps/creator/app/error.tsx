"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@dbk/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-[var(--space-200)] text-center">
      <AlertTriangle className="size-10 text-warning" aria-hidden />
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">Something went wrong</h1>
        <p className="mt-1 max-w-sm text-[14px] text-text-secondary">
          We hit a snag loading this page. You can try again.
        </p>
        {error.digest ? <p className="mt-2 text-[12px] text-text-placeholder">Reference: {error.digest}</p> : null}
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
