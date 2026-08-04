import type { Metadata } from "next";
import { Suspense } from "react";
import { CreatorLoginForm } from "@/components/CreatorLoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatorLoginForm />
    </Suspense>
  );
}
