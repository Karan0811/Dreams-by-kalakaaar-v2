/**
 * Generic search/query helpers. `buildQueryParams` is the reusable base
 * that any future module's own `buildXFilterParams` (e.g. Products'
 * `buildFilterParams` in @dbk/api-client, owned by the Products module) can
 * build on — this package intentionally doesn't know about Products'
 * specific filter fields.
 */

/** Debounces a function by `waitMs`. Cancels any pending call when invoked
 * again before the wait elapses — the standard pattern for a search input
 * that shouldn't fire a request per keystroke. */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  waitMs = 300,
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: TArgs) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), waitMs);
  };
}

/** Converts a flat params object into a URLSearchParams instance, skipping
 * `undefined`/`null`/empty-string values so a route handler never sees
 * `?q=&sort=` from unset filters. Values are coerced with `String()`, so
 * pass primitives (numbers/strings/booleans), not nested objects/arrays. */
export function buildQueryParams(params: Record<string, string | number | boolean | undefined | null>): URLSearchParams {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  return search;
}
