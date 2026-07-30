import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@dbk/utils";

const alertVariants = cva(
  "flex gap-3 rounded-[var(--radius-200)] border p-[var(--space-150)] text-[14px]",
  {
    variants: {
      variant: {
        info: "border-info/30 bg-info-background text-info",
        success: "border-success/30 bg-success-background text-success",
        warning: "border-warning/30 bg-warning-background text-warning",
        error: "border-error/30 bg-error-background text-error",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const icons = { info: Info, success: CheckCircle2, warning: TriangleAlert, error: AlertCircle };

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

/** Calm, muted semantic alert per 05-design-principles.md's Calm Interfaces
 * philosophy — never a saturated, alarm-style treatment. */
export function Alert({ className, variant = "info", title, children, ...props }: AlertProps) {
  const Icon = icons[variant ?? "info"];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 size-[var(--size-icon-md)] shrink-0" aria-hidden />
      <div>
        {title ? <p className="font-medium text-text-primary">{title}</p> : null}
        <div className="text-text-secondary">{children}</div>
      </div>
    </div>
  );
}
