import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@dbk/utils";

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

/**
 * Indeterminate spinner for actions with no shape to skeleton-match (button
 * loading state aside — Button's own `isLoading` prop already covers that)
 * and no known duration to show as a Progress bar — e.g. an inline
 * "checking availability…" state. Prefer Skeleton for anything that has a
 * predictable final layout (§6.5).
 */
export function Spinner({
  size = "md",
  label = "Loading",
  className,
}: {
  size?: keyof typeof sizeMap;
  label?: string;
  className?: string;
}) {
  return (
    <span role="status" className={cn("inline-flex items-center", className)}>
      <Loader2 className={cn("animate-spin text-text-secondary", sizeMap[size])} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
