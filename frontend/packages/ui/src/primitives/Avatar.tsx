"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@dbk/utils";

const sizeMap = {
  sm: "size-[var(--size-avatar-sm)]",
  md: "size-[var(--size-avatar-md)]",
  lg: "size-[var(--size-avatar-lg)]",
} as const;

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: {
  src?: string | null;
  alt: string;
  fallback: string;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-background-subtle",
        sizeMap[size],
        className,
      )}
    >
      {src ? <AvatarPrimitive.Image src={src} alt={alt} className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center text-[13px] font-medium text-text-secondary">
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
