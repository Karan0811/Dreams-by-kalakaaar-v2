"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@dbk/utils";
import { signUp } from "@dbk/auth";
import { Alert, Button, Checkbox, FormField, Input, Label, PasswordInput } from "@dbk/ui";

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    const { error } = await signUp.email({
      email: values.email,
      password: values.password,
      name: values.displayName,
    });

    if (error) {
      // §4.2 AUTH-01: never confirms whether the email is already registered.
      setFormError("We couldn't complete your sign-up with those details. Please try again.");
      return;
    }

    // Registers a matching backend account (see `bridgeBackendRegistration`'s
    // doc comment for why sign-up needs registration, not login).
    await fetch("/api/session/bridge-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email, password: values.password, displayName: values.displayName }),
    });

    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-300)]">
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">Create your account</h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Join Dreams by Kalakaaar to shop, save favorites, and follow creators.
        </p>
      </div>

      {formError ? (
        <Alert variant="error" role="alert">
          {formError}
        </Alert>
      ) : null}

      <FormField id="displayName" label="Full name" error={errors.displayName?.message} required>
        <Input autoComplete="name" {...register("displayName")} />
      </FormField>

      <FormField id="email" label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register("email")} />
      </FormField>

      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
        required
        description="At least 10 characters, with an uppercase letter, a lowercase letter, and a number."
      >
        <PasswordInput autoComplete="new-password" {...register("password")} />
      </FormField>

      <div className="flex items-start gap-2">
        <Checkbox
          id="acceptedTerms"
          checked={watch("acceptedTerms") === true}
          onCheckedChange={(checked) => setValue("acceptedTerms", checked === true, { shouldValidate: true })}
        />
        <Label htmlFor="acceptedTerms" className="font-normal">
          I agree to the{" "}
          <Link href="/legal/terms" className="text-text-link hover:underline">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-text-link hover:underline">Privacy Policy</Link>.
        </Label>
      </div>
      {errors.acceptedTerms ? (
        <p role="alert" className="text-[12px] text-error">{errors.acceptedTerms.message}</p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Create Account
      </Button>

      <p className="text-center text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-text-link hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
