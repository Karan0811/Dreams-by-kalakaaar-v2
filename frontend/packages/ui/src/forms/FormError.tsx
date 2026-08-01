import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@dbk/utils";

export interface FormErrorProps {
  message?: string | null;
  className?: string;
}

/**
 * A form-level error banner — for a failure that isn't tied to any one
 * field (an `INVALID_CREDENTIALS` response, a network failure on submit),
 * as opposed to `FormField`'s per-field `error` prop. Mirrors the
 * hand-rolled `formError` state + inline error `<p>` already used in
 * `LoginForm`/`SignupForm` — this is that same pattern extracted as a
 * shared component, not a new one; existing call sites are free to keep
 * their own markup or adopt this, neither is required by this change.
 * Renders nothing when `message` is falsy, so it's safe to always mount.
 */
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md border border-error/30 bg-error-background px-3 py-2 text-[13px] text-error",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
