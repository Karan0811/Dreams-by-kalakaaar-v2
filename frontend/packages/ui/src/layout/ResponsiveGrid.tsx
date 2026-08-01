import * as React from "react";
import { cn } from "@dbk/utils";

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column count at each breakpoint. Only the keys you pass are applied —
   * omit a breakpoint to inherit the previous one, same as plain Tailwind. */
  cols?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
  /** Gap token key, matching the spacing scale (§2.4). */
  gap?: "100" | "150" | "200" | "300" | "400";
}

// Every Tailwind class this component can emit is written out here as a
// full, static string literal — including the breakpoint prefix — rather
// than assembled at runtime (e.g. `${prefix}grid-cols-${n}`). Tailwind's
// build-time scanner matches literal text in source files; a class name
// only half-present as a template-literal fragment is invisible to it and
// silently produces no CSS. This lookup table is the trade-off that keeps
// the component's API dynamic while keeping every possible output class
// scannable.
const colsClassMap = {
  base: {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  },
  sm: {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
    6: "sm:grid-cols-6",
  },
  md: {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  },
  lg: {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  },
  xl: {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    5: "xl:grid-cols-5",
    6: "xl:grid-cols-6",
  },
} as const;

const gapClassMap = {
  "100": "gap-[var(--space-100)]",
  "150": "gap-[var(--space-150)]",
  "200": "gap-[var(--space-200)]",
  "300": "gap-[var(--space-300)]",
  "400": "gap-[var(--space-400)]",
} as const;

/**
 * Generic column grid (§6.6's responsive grid pattern), used today by the
 * Product grid, and intended for any future card collection (creator
 * dashboards, order lists, etc.) rather than each feature hand-rolling its
 * own `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
 */
export function ResponsiveGrid({
  className,
  cols = { base: 2, md: 3, lg: 4 },
  gap = "300",
  ...props
}: ResponsiveGridProps) {
  const breakpoints = ["base", "sm", "md", "lg", "xl"] as const;
  const colClasses = breakpoints
    .filter((bp) => cols[bp] !== undefined)
    .map((bp) => colsClassMap[bp][cols[bp] as 1 | 2 | 3 | 4 | 5 | 6]);

  return <div className={cn("grid", gapClassMap[gap], ...colClasses, className)} {...props} />;
}
