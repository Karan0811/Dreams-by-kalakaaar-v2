import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@dbk/ui";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner className="mx-auto" label="Loading sign in" />}>
      <LoginForm />
    </Suspense>
  );
}
