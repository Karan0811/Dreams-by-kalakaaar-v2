import { env } from '@/shared/config/env';
import { createModuleLogger } from '@/shared/observability/logger';
import { IntegrationError } from '@/shared/errors/base-errors';

const logger = createModuleLogger('email');

/**
 * Transactional email client — 10-backend-architecture.md Section 15.1
 * Supports both Resend (API) and Gmail SMTP. Provider selection via
 * EMAIL_PROVIDER environment variable ('resend' or 'gmail').
 *
 * In `development`, sends are logged instead of dispatched unless
 * provider credentials are set, so local/CI runs never require live credentials.
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendViaResend(params: SendEmailParams): Promise<void> {
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

async function sendViaGmailSMTP(params: SendEmailParams): Promise<void> {
  // Dynamic import to avoid requiring nodemailer when not using Gmail
  const nodemailer = await import('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.GMAIL_EMAIL,
      pass: env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: env.GMAIL_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (error) {
    logger.error('Gmail SMTP send failed', undefined, { error });
    throw new IntegrationError('Failed to send email at this time. Please try again shortly.');
  }
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const provider = env.EMAIL_PROVIDER || 'resend';
  
  // Log instead of sending in development if credentials not set
  if (provider === 'resend' && !env.RESEND_API_KEY) {
    logger.info('Email send skipped (no RESEND_API_KEY set) — logging instead', {
      to: params.to,
      subject: params.subject,
    });
    return;
  }
  
  if (provider === 'gmail' && (!env.GMAIL_EMAIL || !env.GMAIL_APP_PASSWORD)) {
    logger.info('Email send skipped (GMAIL_EMAIL or GMAIL_APP_PASSWORD not set) — logging instead', {
      to: params.to,
      subject: params.subject,
    });
    return;
  }

  if (provider === 'gmail') {
    await sendViaGmailSMTP(params);
  } else {
    await sendViaResend(params);
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
