import type { Money } from "@dbk/types";

/**
 * Formats a Money value (minor units, e.g. paise) into a localized display
 * string. Never format `amountMinor` inline anywhere else in the codebase —
 * this is the single source of truth per 08-database-design.md's money
 * philosophy and 11-frontend-architecture.md §4.5 (shared, promoted utility).
 */
export function formatMoney(money: Money, options?: { showFraction?: boolean }): string {
  const amount = money.amountMinor / 100;
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: options?.showFraction ? 2 : amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function toMinorUnits(rupees: number): number {
  return Math.round(rupees * 100);
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add Money of different currencies: ${a.currency} vs ${b.currency}`);
  }
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}
