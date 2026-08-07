"use client";

import Link from "next/link";
import { useState } from "react";
import { resetPassword } from "@dbk/auth";
import { Alert, Button, FormField, PasswordInput } from "@dbk/ui";

export function ResetPasswordForm({ token, error }: { token?: string; error?: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "invalid" | "error">("idle");

  if (error || !token) {
    return <Alert variant="error" title="Invalid reset link">This password-reset link is invalid or has expired. <Link href="/forgot-password" className="font-medium underline">Request a new link</Link>.</Alert>;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setState("error");
      return;
    }
    if (password !== confirmPassword) {
      setState("error");
      return;
    }
    setState("submitting");
    const { error: resetError } = await resetPassword({ newPassword: password, token });
    if (resetError) {
      setState("invalid");
      return;
    }
    setState("success");
  }

  if (state === "success") {
    return <div className="flex flex-col gap-4"><Alert variant="success" title="Password updated">You can now sign in with your new password.</Alert><Button asChild size="lg"><Link href="/login">Sign in</Link></Button></div>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div><h1 className="font-serif text-[22px] text-text-primary">Choose a new password</h1><p className="mt-1 text-[14px] text-text-secondary">Use at least 10 characters, including uppercase, lowercase, and a number.</p></div>
      {state === "invalid" ? <Alert variant="error">This reset link is invalid or has expired. Request a new one.</Alert> : null}
      {state === "error" ? <Alert variant="error">Passwords must match and meet the requirements.</Alert> : null}
      <FormField id="password" label="New password" required><PasswordInput id="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></FormField>
      <FormField id="confirm-password" label="Confirm new password" required><PasswordInput id="confirm-password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></FormField>
      <Button type="submit" size="lg" isLoading={state === "submitting"}>Reset password</Button>
    </form>
  );
}
