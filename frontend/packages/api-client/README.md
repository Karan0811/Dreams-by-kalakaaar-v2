# @dbk/api-client

This README covers only the Sprint 0.75 additions. The rest of this
package (`QueryProvider`'s retry policy, `browserFetch`, `ApiError`,
`productKeys`/`cartKeys`/`useProducts`/`useCart`/`useCreatorDashboard`, etc.)
predates this sprint and is Products/Cart/Creator-dashboard domain code —
untouched here.

## `useOptimisticMutation`

```ts
import { useOptimisticMutation } from "@dbk/api-client";

const mutation = useOptimisticMutation({
  mutationFn: (input: ToggleInput) => browserFetch("/api/wishlist", { method: "POST", body: input }),
  queryKey: wishlistKeys.current(),
  updateFn: (current, input) => ({ ...current, items: [...(current?.items ?? []), input.productId] }),
});
```

Generic optimistic-update-with-rollback wrapper around `useMutation`: snapshots
the query, applies `updateFn` immediately, rolls back on error, invalidates
on settle. No domain knowledge of its own — a future feature hook supplies
`queryKey`/`updateFn`, rather than hand-rolling the snapshot/rollback dance
each time (the existing `QueryProvider`'s retry policy and stale-time
defaults are unrelated and untouched by this).

## `createResourceKeys`

```ts
import { createResourceKeys } from "@dbk/api-client";

export const reviewKeys = createResourceKeys<ReviewListParams, string>("reviews");
// reviewKeys.all, .lists(), .list(params), .details(), .detail(id)
```

Generates the same hierarchical key shape already hand-written for
`productKeys`/`cartKeys`/`creatorDashboardKeys` in `query-keys/index.ts` —
those existing objects are untouched (out of scope, Products/Cart/Creator
domain), this factory is purely for the *next* resource's keys.
