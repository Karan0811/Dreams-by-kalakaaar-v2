import { env } from '@/shared/config/env';
import { createModuleLogger } from '@/shared/observability/logger';
import { IntegrationError } from '@/shared/errors/base-errors';

const logger = createModuleLogger('email');

/**
 * Transactional email client — 10-backend-architecture.md Section 15.1
 * (Resend). A thin, direct `fetch` wrapper rather than the `resend` SDK
 * package: the SDK adds no capability this module needs and keeping the
 * HTTP contract explicit here makes the retry/error-mapping behavior
 * auditable in one place.
 *
 * In `development`, sends are logged instead of dispatched unless
 * `RESEND_API_KEY` is set, so local/CI runs never require a live API key.
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.info('Email send skipped (no RESEND_API_KEY set) — logging instead', {
      to: params.to,
      subject: params.subject,
    });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error('Resend send failed', undefined, { status: response.status, body });
    throw new IntegrationError('Failed to send email at this time. Please try again shortly.');
  }
}

export function verificationEmail(rawToken: string): SendEmailParams['html'] {
  const link = `${env.APP_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;
  return `<p>Welcome to Dreams by Kalakaaar. Confirm your email by visiting:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`;
}

export function passwordResetEmail(rawToken: string): SendEmailParams['html'] {
  const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  return `<p>We received a request to reset your password. Visit the link below to choose a new one:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can safely ignore this email. This link expires in 30 minutes.</p>`;
}
