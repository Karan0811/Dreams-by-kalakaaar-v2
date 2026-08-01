export interface ResourceQueryKeys<TParams, TId> {
  all: readonly [string];
  lists: () => readonly [string, "list"];
  list: (params: TParams) => readonly [string, "list", TParams];
  details: () => readonly [string, "detail"];
  detail: (id: TId) => readonly [string, "detail", TId];
}

/**
 * Generates the same `{ all, lists, list(params), details, detail(id) }`
 * shape already hand-written for `productKeys`/`cartKeys`/etc. in
 * `./index.ts`. Those existing key objects are untouched — they're
 * Products/Cart/Creator-dashboard domain code, out of scope this sprint —
 * this factory exists purely so the *next* resource's query keys (reviews,
 * orders, whatever comes after this sprint) don't have to retype the same
 * five lines by hand:
 *
 * ```ts
 * export const reviewKeys = createResourceKeys<ReviewListParams, string>("reviews");
 * ```
 */
export function createResourceKeys<TParams = void, TId = string>(resource: string): ResourceQueryKeys<TParams, TId> {
  const all = [resource] as const;
  return {
    all,
    lists: () => [...all, "list"] as const,
    list: (params: TParams) => [...all, "list", params] as const,
    details: () => [...all, "detail"] as const,
    detail: (id: TId) => [...all, "detail", id] as const,
  };
}
