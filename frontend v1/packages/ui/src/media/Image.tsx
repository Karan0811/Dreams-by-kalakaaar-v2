"use client";

import * as React from "react";
import NextImage, { type ImageProps as NextImageProps } from "next/image";
import { cn } from "@dbk/utils";
import { ImagePlaceholder } from "./ImagePlaceholder";

export interface ImageProps extends Omit<NextImageProps, "src" | "onError" | "alt"> {
  src?: string | null;
  alt: string;
  containerClassName?: string;
}

/**
 * The one place image-loading failure is handled consistently: a missing or
 * broken `src` renders ImagePlaceholder instead of next/image's broken-image
 * icon or a layout-shifting blank box. `alt` is required (not optional) —
 * every image on the platform must describe its content or be explicitly
 * marked decorative by the consumer passing `alt=""`, never omitted.
 */
export function Image({ src, alt, className, containerClassName, fill, ...props }: ImageProps) {
  const [hasError, setHasError] = React.useState(false);
  // Resets `hasError` whenever a new `src` comes in — without this, a
  // component instance reused for multiple images in sequence (a gallery
  // stepping through photos, a form swapping in a freshly-uploaded file)
  // would get stuck showing the placeholder forever after the first
  // failure. This is React's documented "adjust state during render when a
  // prop changes" pattern, not a useEffect, so there's no flash of the old
  // (errored) state before the reset takes effect.
  const [trackedSrc, setTrackedSrc] = React.useState(src);
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setHasError(false);
  }

  if (!src || hasError) {
    return (
      <ImagePlaceholder
        className={cn(fill ? "absolute inset-0" : "aspect-square w-full", containerClassName)}
      />
    );
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      fill={fill}
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
}
