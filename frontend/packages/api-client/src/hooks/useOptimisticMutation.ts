"use client";

import { useMutation, useQueryClient, type QueryKey, type UseMutationOptions } from "@tanstack/react-query";

export interface OptimisticMutationConfig<TData, TVariables, TQueryData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** The query this mutation should optimistically update. */
  queryKey: QueryKey;
  /** Given the current cached data (possibly `undefined`, if nothing's
   * cached yet) and the mutation's variables, returns the optimistically
   * updated cache value. */
  updateFn: (current: TQueryData | undefined, variables: TVariables) => TQueryData;
  /** Queries to invalidate (refetch from the server) once the mutation
   * settles, in addition to `queryKey` itself, which is always
   * invalidated. */
  invalidateKeys?: QueryKey[];
  options?: Omit<
  UseMutationOptions<
    TData,
    Error,
    TVariables,
    { previous: TQueryData | undefined }
  >,
  "mutationFn" | "onMutate"
>;
}

/**
 * A generic optimistic-update wrapper around `useMutation`: applies
 * `updateFn` to the cache immediately, rolls back to the pre-mutation
 * snapshot if the mutation rejects, and invalidates the affected queries
 * once it settles either way. This is the reusable *mechanism* — it has no
 * knowledge of what's being mutated (no Cart/Wishlist/Products awareness);
 * a feature hook like a future `useToggleWishlist` would call this with
 * its own `queryKey`/`updateFn`, not reimplement the snapshot/rollback
 * dance by hand each time.
 */
export function useOptimisticMutation<TData, TVariables, TQueryData = TData>({
  mutationFn,
  queryKey,
  updateFn,
  invalidateKeys = [],
  options,
}: OptimisticMutationConfig<TData, TVariables, TQueryData>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, { previous: TQueryData | undefined }>({
    mutationFn,
    onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey });

  const previous = queryClient.getQueryData<TQueryData>(queryKey);

  queryClient.setQueryData<TQueryData>(
    queryKey,
    (current) => updateFn(current, variables),
  );

  return { previous };
},
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
    ...(options ?? {}),
  });
}
