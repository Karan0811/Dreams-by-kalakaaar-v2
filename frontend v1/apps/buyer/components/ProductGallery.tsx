"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@dbk/utils";
import type { ProductImage } from "@dbk/types";

export function ProductGallery({ images, productTitle }: { images: ProductImage[]; productTitle: string }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-400)] bg-background-subtle">
        {active ? (
          <Image
            src={active.url}
            alt={active.altText}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>
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
    </div>
  );
}
