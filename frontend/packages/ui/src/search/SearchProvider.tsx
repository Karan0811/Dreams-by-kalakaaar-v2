"use client";

import * as React from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export interface SearchContextValue {
  query: string;
  setQuery: (query: string) => void;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

const SearchContext = React.createContext<SearchContextValue | null>(null);

export interface SearchProviderProps {
  /** Recent searches persist under this localStorage key — scope it per
   * app/feature (e.g. `"buyer-recent-searches"`) so unrelated search boxes
   * don't share history. */
  storageKey: string;
  maxRecentSearches?: number;
  children: React.ReactNode;
}

/**
 * Generic search state — a query string plus a persisted recent-searches
 * list. Deliberately has no opinion on *what* is being searched or how
 * results are fetched (no Products knowledge here); a feature's own search
 * hook (e.g. a future `useProductSearch`) would consume `query` from this
 * context and do the actual data fetching itself.
 */
export function SearchProvider({ storageKey, maxRecentSearches = 8, children }: SearchProviderProps) {
  const [query, setQuery] = React.useState("");
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(storageKey, []);

  const addRecentSearch = React.useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setRecentSearches((prev) => [trimmed, ...prev.filter((t) => t !== trimmed)].slice(0, maxRecentSearches));
    },
    [maxRecentSearches, setRecentSearches],
  );

  const clearRecentSearches = React.useCallback(() => setRecentSearches([]), [setRecentSearches]);

  const value = React.useMemo(
    () => ({ query, setQuery, recentSearches, addRecentSearch, clearRecentSearches }),
    [query, recentSearches, addRecentSearch, clearRecentSearches],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearchContext(): SearchContextValue {
  const context = React.useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }
  return context;
}
