import * as React from "react";
import { cn } from "@dbk/utils";

/**
 * A moving-gradient "shimmer" sweep, as an alternative to `Skeleton`'s
 * pulse-opacity animation for contexts that want a more dynamic loading
 * feel (a hero image placeholder, a long content block). Wrap any
 * placeholder shape in this rather than reaching for `Skeleton` twice —
 * they're two different animations for the same underlying "this is still
 * loading" placeholder-box purpose, use whichever fits the moment, not
 * both stacked on one element.
 *
 * The keyframe is scoped to this file (not added to
 * `@dbk/config/tailwind/theme.css`) — it's a single component-local
 * animation, not a design token other components need to reference, so a
 * shared config change wasn't warranted for it. Respects
 * `prefers-reduced-motion` by disabling the sweep and falling back to a
 * static tint.
 */
export function Shimmer({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-200)] bg-background-subtle", className)}>
      {children}
      <style>{`
        @keyframes dbk-shimmer-sweep {
          100% { transform: translateX(100%); }
        }
      `}</style>
      <div
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[var(--color-neutral-000)]/40 to-transparent motion-safe:animate-[dbk-shimmer-sweep_1.6s_ease-in-out_infinite]"
      />
    </div>
  );
}
