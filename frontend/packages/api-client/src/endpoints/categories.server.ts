import "server-only";
import type { CategoryNode, CreateCategoryPayload, UpdateCategoryPayload } from "@dbk/types";
import { apiFetch } from "../client";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

/** Public — no auth required to browse Categories/Subcategories. */
export async function fetchCategories(params: { parentId?: string; flat?: boolean } = {}): Promise<{
  data: CategoryNode[];
}> {
  const search = new URLSearchParams();
  if (params.parentId) search.set("parentId", params.parentId);
  if (params.flat) search.set("flat", "true");
  const query = search.toString();

  return apiFetch<{ data: CategoryNode[] }>(`/categories${query ? `?${query}` : ""}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function fetchCategory(categoryId: string): Promise<CategoryNode> {
  return apiFetch<CategoryNode>(`/categories/${categoryId}`, { method: "GET", cache: "no-store" });
}

/** Admin-only (`categories:write`) — `accessToken` must belong to a user holding that permission. */
export async function createCategory(accessToken: string, input: CreateCategoryPayload): Promise<CategoryNode> {
  return apiFetch<CategoryNode>("/categories", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function updateCategory(
  accessToken: string,
  categoryId: string,
  input: UpdateCategoryPayload,
): Promise<CategoryNode> {
  return apiFetch<CategoryNode>(`/categories/${categoryId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: input,
  });
}

export async function deleteCategory(accessToken: string, categoryId: string): Promise<void> {
  await apiFetch<void>(`/categories/${categoryId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

export async function setCategoryParent(
  accessToken: string,
  categoryId: string,
  parentId: string | null,
): Promise<CategoryNode> {
  return apiFetch<CategoryNode>(`/categories/${categoryId}/parent`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: { parentId },
  });
}
