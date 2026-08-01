import * as React from "react";
import { Spinner } from "../feedback/Spinner";

/**
 * Full-viewport centered loading state. The platform's default for a route
 * segment's `loading.tsx` is a shape-matched `Skeleton` layout specific to
 * that page (11-frontend-architecture.md §6.5) — reach for this only when
 * there's no sensible shape to match yet (an entirely new route segment,
 * or a shell that loads before its own layout is known), not as a
 * shortcut instead of building the real skeleton.
 */
export function LoadingLayout({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
