"use client";

import { createAuthClient } from "better-auth/react";

/**
 * The client-side counterpart to `better-auth.config.ts`. Auth forms
 * (Login, Signup, Forgot/Reset Password) call these methods directly rather
 * than a hand-rolled Route Handler, since Better Auth already provides a
 * typed, session-cookie-aware client (11-frontend-architecture.md §12.1).
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient;
