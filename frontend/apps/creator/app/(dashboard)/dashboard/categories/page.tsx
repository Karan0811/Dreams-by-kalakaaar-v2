import type { Metadata } from "next";
import { CategoriesAdminClient } from "@/components/CategoriesAdminClient";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return <CategoriesAdminClient />;
}
