import * as React from "react";
import { getErrorMessage } from "@dbk/utils";
import { ErrorState } from "./ErrorState";

export interface ApiErrorLike {
  code?: string;
  message: string;
}

export interface ApiErrorStateProps {
  /** Structurally typed rather than importing `@dbk/api-client`'s `ApiError`
   * class — `packages/ui` doesn't take a dependency on `packages/api-client`
   * for this. A real `ApiError` instance satisfies this shape directly. */
  error: ApiErrorLike;
  title?: string;
  onRetry?: () => void;
}

/**
 * The API-aware `ErrorState`: looks `error.code` up in `@dbk/utils`'s
 * `getErrorMessage()` for friendly copy, falling back to a generic message
 * if the code is unrecognized — never surfaces `error.message` (the raw
 * server string) directly, same reasoning as `ErrorBoundary`'s default
 * fallback. Use plain `ErrorState` directly for non-API failures.
 */
export function ApiErrorState({ error, title, onRetry }: ApiErrorStateProps) {
  return <ErrorState title={title} description={getErrorMessage(error.code)} onRetry={onRetry} />;
}
