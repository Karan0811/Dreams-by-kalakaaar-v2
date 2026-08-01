"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";
import { ErrorState } from "./ErrorState";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export interface NetworkErrorStateProps {
  onRetry?: () => void;
}

/** A preset of `ErrorState` specifically for a failed request while
 * offline — swaps the icon and copy to something the person can actually
 * act on ("you're offline") rather than the generic "something went
 * wrong". If `useOnlineStatus` reports the connection is back, this
 * quietly falls back to the plain `ErrorState` copy, since the failure
 * wasn't (or is no longer) a connectivity problem. */
export function NetworkErrorState({ onRetry }: NetworkErrorStateProps) {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <ErrorState
        title="You're offline"
        description="Check your internet connection and try again."
        onRetry={onRetry}
        retryLabel="Retry"
      />
    );
  }

  return <ErrorState title="Couldn't connect" description="Please try again in a moment." onRetry={onRetry} />;
}

/** Re-exported for callers that just want the icon (e.g. a compact inline
 * offline indicator elsewhere in the UI) without the full state block. */
export { WifiOff as NetworkErrorIcon };
