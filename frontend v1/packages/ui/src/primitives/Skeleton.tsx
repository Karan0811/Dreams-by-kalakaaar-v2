import { cn } from "@dbk/utils";

/** The platform-wide loading primitive (11-frontend-architecture.md §6.5) —
 * every loading.tsx renders shape-matched Skeletons, never a generic spinner. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-200)] bg-background-subtle", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
