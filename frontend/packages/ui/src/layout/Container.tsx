import * as React from "react";
import { cn } from "@dbk/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Matches the two container tokens already defined in
   * @dbk/config/tailwind/theme.css §6.3 — `lg` mirrors what Navbar/Footer
   * hand-rolled as `max-w-(--container-content-xl)` inline; centralizing it
   * here means those call sites can adopt this component without a visual
   * change, and any future container-width tweak happens in one place. */
  size?: "lg" | "xl";
  as?: React.ElementType;
}

export function Container({ className, size = "xl", as: Comp = "div", ...props }: ContainerProps) {
  return (
    <Comp
      className={cn(
        "mx-auto w-full px-[var(--space-200)] lg:px-[var(--space-600)]",
        size === "xl" ? "max-w-(--container-content-xl)" : "max-w-(--container-content-lg)",
        className,
      )}
      {...props}
    />
  );
}
