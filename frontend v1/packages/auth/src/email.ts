import "server-only";
import { Resend } from "resend";

/**
 * Both Better Auth callbacks that need to deliver a link (email
 * verification, password reset) go through here. In any environment without
 * `RESEND_API_KEY` set (e.g., a contributor's first `npm run dev` before
 * they've filled in `.env.local`), we log the link instead of throwing —
 * auth flows stay usable locally without a real email provider, while still
 * making the specific link/API key requirement visible in the terminal
 * rather than failing silently.
 */
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "Dreams by Kalakaaar <no-reply@dreamsbykalakaaar.com>";

export async function sendVerificationEmail({
  to,
  verificationUrl,
}: {
  to: string;
  verificationUrl: string;
}): Promise<void> {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn(
      `[email:dev-fallback] RESEND_API_KEY is not set — verification link for ${to}: ${verificationUrl}`,
    );
    return;
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your email — Dreams by Kalakaaar",
    html: `<p>Welcome to Dreams by Kalakaaar. Please confirm your email address:</p><p><a href="${verificationUrl}">Verify Email</a></p><p>If you didn't create this account, you can safely ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn(`[email:dev-fallback] RESEND_API_KEY is not set — reset link for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your password — Dreams by Kalakaaar",
    html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
  });
}
