"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryNode, CreateCategoryPayload, UpdateCategoryPayload } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { categoryKeys } from "../query-keys";

export function useCategories(params: { parentId?: string; flat?: boolean } = {}) {
  const search = new URLSearchParams();
  if (params.parentId) search.set("parentId", params.parentId);
  if (params.flat) search.set("flat", "true");
  const query = search.toString();

  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () =>
      browserFetch<{ data: CategoryNode[] }>(`/api/categories${query ? `?${query}` : ""}`).then(
        (r) => r.data,
      ),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryPayload) =>
      browserFetch<CategoryNode>("/api/categories", { method: "POST", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, ...input }: UpdateCategoryPayload & { categoryId: string }) =>
      browserFetch<CategoryNode>(`/api/categories/${categoryId}`, { method: "PATCH", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      browserFetch<void>(`/api/categories/${categoryId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useSetCategoryParent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, parentId }: { categoryId: string; parentId: string | null }) =>
      browserFetch<CategoryNode>(`/api/categories/${categoryId}/parent`, {
        method: "PUT",
        body: { parentId },
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
