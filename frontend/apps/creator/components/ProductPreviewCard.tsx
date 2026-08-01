import type { CreatorProduct, CreatorProductVariant } from "@dbk/types";
import { formatMoney } from "@dbk/utils";
import { Card } from "@dbk/ui";

export function ProductPreviewCard({ product }: { product: CreatorProduct }) {
  const primaryImage = (product.media ?? []).find((m) => m.isPrimary) ?? product.media?.[0];
  const cheapestVariant = (product.variants ?? []).reduce<CreatorProductVariant | undefined>(
    (min, variant) => (!min || variant.priceAmount < min.priceAmount ? variant : min),
    undefined,
  );

  return (
    <Card className="flex flex-col gap-2 p-0 overflow-hidden">
      <p className="border-b border-border px-[var(--space-200)] py-[var(--space-150)] text-[13px] font-medium text-text-secondary">
        Buyer preview
      </p>
      <div className="aspect-square w-full bg-background-subtle">
        {primaryImage?.publicUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- see ProductImageGallery's identical rationale
          <img src={primaryImage.publicUrl} alt={primaryImage.altText ?? ""} className="size-full object-cover" />
        ) : null}
      </div>
      <div className="px-[var(--space-200)] pb-[var(--space-200)]">
        <p className="truncate text-[14px] font-medium text-text-primary">{product.title}</p>
        <p className="text-[13px] text-text-secondary">
          {cheapestVariant
            ? formatMoney({ amountMinor: cheapestVariant.priceAmount, currency: cheapestVariant.priceCurrency as "INR" })
            : "No price set"}
        </p>
      </div>
    </Card>
  );
}
