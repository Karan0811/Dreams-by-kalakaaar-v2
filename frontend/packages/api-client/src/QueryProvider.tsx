"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "./errors";

/**
 * One QueryClient instance per browser tab (created lazily inside
 * `useState` so it survives Fast Refresh but never leaks across requests on
 * the server, per the official Next.js App Router + TanStack Query
 * integration pattern). Default `retry` skips 4xx client errors — those are
 * never transient — and retries network/5xx errors up to twice
 * (11-frontend-architecture.md §10.7/§9.10).
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
