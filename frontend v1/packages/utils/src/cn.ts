import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Standard shadcn/ui class-merging helper: conditionally joins class names
 * (clsx) then resolves conflicting Tailwind utility classes (twMerge) so a
 * consumer's override always wins over a component's default. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
