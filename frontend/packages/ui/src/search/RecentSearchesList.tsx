"use client";

import * as React from "react";
import { X } from "lucide-react";

export interface RecentSearchesListProps {
  searches: string[];
  onSelect: (term: string) => void;
  onClear: () => void;
  label?: string;
}

/** Renders the `recentSearches` list from `useSearchContext` as clickable
 * terms plus a "Clear" action. Purely presentational — reading and
 * updating the underlying list stays with `SearchProvider`. */
export function RecentSearchesList({ searches, onSelect, onClear, label = "Recent searches" }: RecentSearchesListProps) {
  if (searches.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-text-secondary">{label}</span>
        <button
          type="button"
          onClick={onClear}
          className="text-[12px] text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded"
        >
          Clear
        </button>
      </div>
      <ul className="flex flex-col gap-0.5">
        {searches.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onSelect(term)}
              className="flex min-h-[var(--size-touch-target-min)] w-full items-center justify-between gap-2 rounded-md px-2 text-left text-[14px] text-text-primary hover:bg-background-subtle"
            >
              {term}
              <X className="size-3.5 shrink-0 text-text-secondary" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
