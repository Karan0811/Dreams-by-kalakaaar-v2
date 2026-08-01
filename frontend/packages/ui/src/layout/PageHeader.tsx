import * as React from "react";
import { cn } from "@dbk/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Typically a `Breadcrumb` — kept generic rather than baking that
   * component in, since not every page needs one. */
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** The standard "top of page" block: optional breadcrumb, an `<h1>`,
 * optional description, and a right-aligned actions slot (buttons like
 * "Add Product" — though the button's own contents are still the
 * consuming feature's business, not this component's). */
export function PageHeader({ title, description, breadcrumb, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-[var(--space-300)] flex flex-col gap-[var(--space-150)]", className)}>
      {breadcrumb}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-text-primary sm:text-[28px]">{title}</h1>
          {description ? <p className="mt-1 text-[14px] text-text-secondary">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
