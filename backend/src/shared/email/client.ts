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
  try {
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
  } catch (error) {
    // In development, log but don't fail to allow testing
    if (process.env.NODE_ENV !== 'production') {
      logger.error('Resend send failed (development - logging and continuing)', error);
      return;
    }
    throw error;
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
    // In development, log but don't fail to allow testing
    if (process.env.NODE_ENV !== 'production') {
      logger.error('Gmail SMTP send failed (development - logging and continuing)', error);
      return;
    }
    logger.error('Gmail SMTP send failed', undefined, { error });
    throw new IntegrationError('Failed to send email at this time. Please try again shortly.');
  }
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const provider = env.EMAIL_PROVIDER || 'resend';
  
  // In development without credentials, log and succeed silently to allow testing
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const hasResendCreds = !!env.RESEND_API_KEY && env.RESEND_API_KEY !== 'replace-me';
  const hasGmailCreds = !!env.GMAIL_EMAIL && !!env.GMAIL_APP_PASSWORD && 
                        env.GMAIL_EMAIL !== 'your-email@gmail.com' && 
                        env.GMAIL_APP_PASSWORD !== 'your-app-password';
  
  if (isDevelopment && !hasResendCreds && !hasGmailCreds) {
    logger.info('Email send skipped (development without valid credentials) — logging and succeeding', {
      to: params.to,
      subject: params.subject,
      htmlLength: params.html.length,
    });
    return;
  }
  
  // Log instead of sending if credentials not set for the chosen provider
  if (provider === 'resend' && !hasResendCreds) {
    logger.info('Email send skipped (no valid RESEND_API_KEY set) — logging instead', {
      to: params.to,
      subject: params.subject,
      htmlLength: params.html.length,
    });
    return;
  }
  
  if (provider === 'gmail' && !hasGmailCreds) {
    logger.info('Email send skipped (no valid GMAIL_EMAIL or GMAIL_APP_PASSWORD set) — logging instead', {
      to: params.to,
      subject: params.subject,
      htmlLength: params.html.length,
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
