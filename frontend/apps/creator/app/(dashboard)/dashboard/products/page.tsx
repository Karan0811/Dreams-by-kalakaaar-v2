import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@dbk/ui";
import { resolveMyStoreId } from "@/lib/resolve-store";
import { StoreGateNotice } from "@/components/StoreGateNotice";
import { ProductsListClient } from "@/components/ProductsListClient";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const resolved = await resolveMyStoreId();

  return (
    <div className="mx-auto max-w-(--container-content-xl)">
      <div className="mb-[var(--space-300)] flex items-center justify-between">
        <h1 className="font-serif text-[24px] text-text-primary">Products</h1>
        {resolved.status === "ready" ? (
          <Button asChild>
            <Link href="/dashboard/products/new">New Product</Link>
          </Button>
        ) : null}
      </div>

      {resolved.status === "ready" ? (
        <ProductsListClient storeId={resolved.storeId} />
      ) : (
        <StoreGateNotice status={resolved.status} />
      )}
    </div>
  );
}
