"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@dbk/utils";
import { requestPasswordReset } from "@dbk/auth";
import { Alert, Button, FormField, Input } from "@dbk/ui";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    await requestPasswordReset({ email: values.email, redirectTo: "/reset-password" });
    // §4.4 AUTH-04: identical confirmation whether or not the account exists.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Alert variant="success" title="Check your email">
        If an account exists for that email, we&apos;ve sent a link to reset your password.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-300)]">
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">Reset your password</h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <FormField id="email" label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register("email")} />
      </FormField>

      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Send Reset Link
      </Button>

      <p className="text-center text-[13px] text-text-secondary">
        <Link href="/login" className="font-medium text-text-link hover:underline">
          Back to Sign In
        </Link>
      </p>
    </form>
  );
}
