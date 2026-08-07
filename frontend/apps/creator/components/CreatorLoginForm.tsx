"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@dbk/utils";
import { signIn } from "@dbk/auth";
import { Alert, Button, FormField, Input, PasswordInput } from "@dbk/ui";

export function CreatorLoginForm() {
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
      setFormError("That email or password doesn't look right. Please try again.");
      return;
    }

    router.push(searchParams.get("redirectTo") ?? "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-300)]">
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">Creator sign in</h1>
        <p className="mt-1 text-[14px] text-text-secondary">Manage your storefront on Dreams by Kalakaaar.</p>
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

      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Sign In
      </Button>

      <div className="flex justify-end">
        <a
          href={`${process.env.NEXT_PUBLIC_BUYER_APP_URL ?? "http://localhost:3002"}/forgot-password`}
          className="text-[13px] font-medium text-text-link hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <p className="text-center text-[13px] text-text-secondary">
        Not a creator yet?{" "}
        <Link href="/become-a-creator" className="font-medium text-text-link hover:underline">
          Apply here
        </Link>
      </p>
    </form>
  );
}
