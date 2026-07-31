import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@dbk/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Standard breadcrumb trail (§4.9). The final item never links (it's the
 * current page, marked with `aria-current="page"`) — pass it without
 * `href` or it's ignored regardless. */
export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-text-secondary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3.5 shrink-0" aria-hidden /> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-text-link">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-text-primary" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
