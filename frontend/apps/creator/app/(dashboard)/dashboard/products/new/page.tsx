import type { Metadata } from "next";
import { resolveMyStoreId } from "@/lib/resolve-store";
import { StoreGateNotice } from "@/components/StoreGateNotice";
import { ProductCreateForm } from "@/components/ProductCreateForm";

export const metadata: Metadata = { title: "New Product" };

export default async function NewProductPage() {
  const resolved = await resolveMyStoreId();

  return (
    <div className="mx-auto max-w-(--container-content-xl)">
      <h1 className="mb-[var(--space-300)] font-serif text-[24px] text-text-primary">New Product</h1>
      {resolved.status === "ready" ? (
        <ProductCreateForm storeId={resolved.storeId} />
      ) : (
        <StoreGateNotice status={resolved.status} />
      )}
    </div>
  );
}
