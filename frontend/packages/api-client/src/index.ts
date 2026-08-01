/**
 * Client-safe entry point (`@dbk/api-client`). Contains only what a Client
 * Component may import: TanStack Query hooks, the browser-side fetch
 * wrapper (calls this app's own `/api/*` Route Handlers, never the upstream
 * API directly), the QueryProvider, and pure helpers. Anything that talks to
 * the upstream REST API or reads server-only env vars lives in
 * `@dbk/api-client/server` instead — see that file for why the split
 * matters (11-frontend-architecture.md §10.1).
 */
export { ApiError } from "./errors";
export { QueryProvider } from "./QueryProvider";
export { browserFetch, type BrowserRequestOptions } from "./browserFetch";
export { buildFilterParams } from "./endpoints/buildFilterParams";
export * from "./query-keys";
export * from "./hooks/useProducts";
export * from "./hooks/useCart";
export * from "./hooks/useCreatorDashboard";
export { useOptimisticMutation, type OptimisticMutationConfig } from "./hooks/useOptimisticMutation";
