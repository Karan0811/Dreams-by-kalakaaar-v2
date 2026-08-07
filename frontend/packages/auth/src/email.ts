import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";

/**
 * Both Better Auth callbacks that need to deliver a link (email
 * verification, password reset) go through here.
 *
 * Two real providers are supported, checked in this order:
 * 1. SMTP (nodemailer) — set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD.
 *    This is the path a Gmail account (with an App Password — a regular
 *    Google account password will NOT work here, since Gmail requires
 *    2-Step Verification + a generated App Password for SMTP auth) uses.
 *    See ../../../apps/buyer/.env.example for the exact Gmail values.
 * 2. Resend (RESEND_API_KEY) — a transactional-email API, kept as an
 *    alternative for anyone who'd rather not run their personal/workspace
 *    Gmail account as an SMTP relay.
 *
 * In any environment with neither configured (e.g. a contributor's first
 * `npm run dev` before filling in `.env.local`), the link is logged to the
 * console instead of thrown — auth flows stay usable locally without a
 * real email provider, while making the missing configuration visible in
 * the terminal rather than failing silently.
 */

const FROM_ADDRESS =
  process.env.SMTP_FROM_EMAIL ??
  process.env.RESEND_FROM_EMAIL ??
  "Dreams by Kalakaaar <no-reply@dreamsbykalakaaar.com>";

const hasSmtpConfig = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD,
);

const smtpTransport = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      // Port 465 is implicit TLS; 587 (Gmail's default) is STARTTLS, which
      // nodemailer negotiates automatically when secure: false.
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  if (smtpTransport) {
    await smtpTransport.sendMail({ from: FROM_ADDRESS, to, subject, html });
    return;
  }

  if (resend) {
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
    return;
  }

  console.warn(
    `[email:dev-fallback] Neither SMTP_HOST/SMTP_USER/SMTP_PASSWORD nor RESEND_API_KEY is set — "${subject}" for ${to} was not sent. Content:\n${html}`,
  );
}

export async function sendVerificationEmail({
  to,
  verificationUrl,
}: {
  to: string;
  verificationUrl: string;
}): Promise<void> {
  await sendEmail({
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
  await sendEmail({
    to,
    subject: "Reset your password — Dreams by Kalakaaar",
    html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
  });
}
