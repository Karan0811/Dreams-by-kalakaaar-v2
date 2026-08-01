import type { Metadata } from "next";
import { resolveMyStoreId } from "@/lib/resolve-store";
import { StoreGateNotice } from "@/components/StoreGateNotice";
import { ProductEditView } from "@/components/ProductEditView";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const resolved = await resolveMyStoreId();

  return (
    <div className="mx-auto max-w-(--container-content-xl)">
      <h1 className="mb-[var(--space-300)] font-serif text-[24px] text-text-primary">Edit Product</h1>
      {resolved.status === "ready" ? (
        <ProductEditView storeId={resolved.storeId} productId={productId} />
      ) : (
        <StoreGateNotice status={resolved.status} />
      )}
    </div>
  );
}
