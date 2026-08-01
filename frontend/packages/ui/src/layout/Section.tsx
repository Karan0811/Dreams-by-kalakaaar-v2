import * as React from "react";
import { cn } from "@dbk/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Vertical padding scale, keyed to the 4pt spacing tokens (§2.4) rather
   * than a free-form className, so every page section on the platform picks
   * from the same small set of rhythms instead of one-off paddings. */
  spacing?: "sm" | "md" | "lg";
  as?: React.ElementType;
}

const spacingMap = {
  sm: "py-[var(--space-400)]",
  md: "py-[var(--space-600)]",
  lg: "py-[var(--space-800)]",
} as const;

export function Section({ className, spacing = "md", as: Comp = "section", ...props }: SectionProps) {
  return <Comp className={cn(spacingMap[spacing], className)} {...props} />;
}
