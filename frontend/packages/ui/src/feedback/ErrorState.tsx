import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@dbk/utils";
import { Button } from "../primitives/Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * The generic recoverable-error state — a failed Route Handler call, a
 * Server Component's `error.tsx` boundary content, etc. `description`
 * should already be end-user-safe copy from `getErrorMessage()`
 * (@dbk/utils/errorMessages) — never a raw `error.message` (§10.9).
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-2 rounded-[var(--radius-300)] border border-error/30 bg-error-background px-[var(--space-300)] py-[var(--space-800)] text-center",
        className,
      )}
    >
      <AlertTriangle className="mb-1 size-8 text-error" aria-hidden />
      <p className="text-[16px] font-medium text-text-primary">{title}</p>
      {description ? <p className="max-w-sm text-[14px] text-text-secondary">{description}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-[var(--space-150)]">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
