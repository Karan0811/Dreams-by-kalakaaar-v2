"use client";

import * as React from "react";
import { ErrorState } from "./ErrorState";
import { logger } from "@dbk/utils";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Defaults to `ErrorState`. Receives the caught error and a `reset`
   * function that clears the boundary's error state and re-renders
   * `children` — wire it to a "Try again" action if the render error might
   * not recur (e.g. it was caused by a since-refreshed piece of data). */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * React only supports error boundaries via class components (`getDerivedStateFromError`/
 * `componentDidCatch` have no hook equivalent) — this is that one
 * necessary class component, reusable across the app rather than every
 * feature writing its own. Logs via `@dbk/utils`'s `logger`; wire `onError`
 * to also report to Sentry (18-observability-and-monitoring.md) at the
 * call site that needs it, since this component has no monitoring
 * integration baked in.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
  error: null,
};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(
  error: Error,
  info: React.ErrorInfo,
) {
    logger.error("Caught by ErrorBoundary", { message: error.message, componentStack: info.componentStack ?? undefined });
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <ErrorState
        description="An unexpected error occurred. Please try again, or come back later if the problem continues."
        onRetry={this.reset}
      />
    );
  }
}
