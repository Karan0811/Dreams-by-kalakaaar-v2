import * as React from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@dbk/utils";

/** Static placeholder box for a known-missing image (e.g. a product with no
 * uploaded photos yet in the Creator's draft state). For an image that's
 * expected but still loading, prefer next/image's own blur placeholder via
 * `Image` (below) — this component is for the "there is no image" case, not
 * the "image hasn't loaded yet" case. */
export function ImagePlaceholder({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background-subtle text-text-secondary",
        className,
      )}
    >
      <ImageOff className={cn("size-6", iconClassName)} aria-hidden />
    </div>
  );
}
