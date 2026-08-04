import type { Metadata } from "next";
import { CreatorLoginForm } from "@/components/CreatorLoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return <CreatorLoginForm />;
}
