"use client";

import * as React from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@dbk/utils";
import type { ProductImage } from "@dbk/types";
import { Dialog, DialogContent, DialogTitle } from "@dbk/ui";

export function ProductGallery({ images, productTitle }: { images: ProductImage[]; productTitle: string }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const active = images[activeIndex] ?? images[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => active && setZoomOpen(true)}
        disabled={!active}
        className="group relative aspect-square w-full overflow-hidden rounded-[var(--radius-400)] bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        aria-label={active ? `Zoom in on ${productTitle}` : undefined}
      >
        {active ? (
          <>
            <Image
              src={active.url}
              alt={active.altText}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-4" aria-hidden />
            </span>
          </>
        ) : null}
      </button>
      {images.length > 1 ? (
        <div role="tablist" aria-label={`${productTitle} images`} className="mt-[var(--space-150)] flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-200)] border-2",
                index === activeIndex ? "border-brand-primary" : "border-transparent",
              )}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-3xl bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{productTitle}</DialogTitle>
          {active ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-400)]">
              <Image src={active.url} alt={active.altText} fill sizes="90vw" className="object-contain" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
