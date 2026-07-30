import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@dbk/utils";

/** Chips/tags per §2.5 radius-100 and §3.6 semantic colors — always paired
 * with a label, never color alone (§3.12). */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-100)] px-2 py-0.5 text-[12px] font-medium leading-4",
  {
    variants: {
      variant: {
        neutral: "bg-background-subtle text-text-secondary",
        brand: "bg-brand-primary/10 text-brand-primary",
        success: "bg-success-background text-success",
        warning: "bg-warning-background text-warning",
        error: "bg-error-background text-error",
        info: "bg-info-background text-info",
        accent: "bg-brand-accent/15 text-[color:var(--color-brand-accent)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
