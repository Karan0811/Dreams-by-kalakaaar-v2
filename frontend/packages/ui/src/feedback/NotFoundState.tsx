import * as React from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { cn } from "@dbk/utils";
import { Button } from "../primitives/Button";

export interface NotFoundStateProps {
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}

/**
 * Distinct from EmptyState (a collection that's legitimately empty) and
 * ErrorState (something recoverable failed): this is specifically "the
 * thing you asked for doesn't exist" — a deleted/unpublished product slug,
 * an unknown creator handle, a 404 route. Kept as its own component so the
 * copy and icon can't quietly drift out of sync with EmptyState's, which is
 * a different situation with a different expected user reaction.
 */
export function NotFoundState({
  title = "We couldn't find that",
  description = "It may have been moved, unpublished, or the link might be incorrect.",
  homeHref = "/",
  homeLabel = "Back to home",
  className,
}: NotFoundStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 px-[var(--space-300)] py-[var(--space-1200)] text-center",
        className,
      )}
    >
      <SearchX className="mb-1 size-10 text-text-secondary" aria-hidden />
      <p className="font-serif text-[20px] text-text-primary">{title}</p>
      <p className="max-w-sm text-[14px] text-text-secondary">{description}</p>
      <Button asChild size="lg" className="mt-[var(--space-150)]">
        <Link href={homeHref}>{homeLabel}</Link>
      </Button>
    </div>
  );
}
