"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@dbk/utils";
import { signIn } from "@dbk/auth";
import { Alert, Button, FormField, Input, PasswordInput } from "@dbk/ui";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const { error } = await signIn.email({ email: values.email, password: values.password });

    if (error) {
      // §4.1: a generic message that never confirms which field was wrong.
      setFormError("That email or password doesn't look right. Please try again.");
      return;
    }

    // Bridges this Better Auth session to the backend's own JWT auth (see
    // `@dbk/auth`'s `access-token.ts` doc comment) — every authenticated
    // BFF route (Cart, Orders, Wishlist, ...) depends on this having run.
    // A bridge failure isn't treated as a login failure (the account IS
    // signed in) but is surfaced so the person knows some features may not
    // work until they refresh or sign in again.
    const bridgeResponse = await fetch("/api/session/bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email, password: values.password }),
    });
    if (!bridgeResponse.ok) {
      setFormError("Signed in, but some features may be unavailable until you refresh the page.");
    }

    router.push(searchParams.get("redirectTo") ?? "/account/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-300)]">
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">Welcome back</h1>
        <p className="mt-1 text-[14px] text-text-secondary">Sign in to your Dreams by Kalakaaar account.</p>
      </div>

      {formError ? (
        <Alert variant="error" role="alert">
          {formError}
        </Alert>
      ) : null}

      <FormField id="email" label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register("email")} />
      </FormField>

      <FormField id="password" label="Password" error={errors.password?.message} required>
        <PasswordInput autoComplete="current-password" {...register("password")} />
      </FormField>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-[13px] font-medium text-text-link hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Sign In
      </Button>

      <p className="text-center text-[13px] text-text-secondary">
        New here?{" "}
        <Link href="/signup" className="font-medium text-text-link hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
