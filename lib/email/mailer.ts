import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import React from 'react';
import { logError, logInfo, logWarn, maskEmail } from '@/lib/structured-log';

const gmailUser = process.env.Email;
const gmailAppPassword = process.env.AppPassword;

if (!gmailUser || !gmailAppPassword) {
  logWarn('email.config_missing', {
    hasEmailEnv: Boolean(gmailUser),
    hasAppPasswordEnv: Boolean(gmailAppPassword),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },
});

export const fromEmail = gmailUser || 'no-reply@gmail.com';

// Email sending helper following the { data, error } pattern.
export async function sendEmail({
  to,
  subject,
  html,
  react,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  react?: React.ReactElement;
  replyTo?: string | string[];
}) {
  if (!gmailUser || !gmailAppPassword) {
    logError('email.send_config_missing', {
      to: Array.isArray(to) ? to.map(maskEmail) : maskEmail(to),
      subject,
    });
    return {
      data: null,
      error: { message: 'Email service not configured', name: 'ConfigError' },
    };
  }

  // Render React component to HTML if provided
  let emailHtml = html;
  if (react) {
    emailHtml = await render(react);
  }

  if (!emailHtml) {
    logError('email.send_missing_content', {
      to: Array.isArray(to) ? to.map(maskEmail) : maskEmail(to),
      subject,
    });
    return {
      data: null,
      error: { message: 'No email content provided', name: 'ValidationError' },
    };
  }

  const toAddresses = Array.isArray(to) ? to.join(',') : to;
  const replyToAddresses = replyTo
    ? Array.isArray(replyTo) ? replyTo.join(',') : replyTo
    : fromEmail;

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: toAddresses,
      subject,
      html: emailHtml,
      replyTo: replyToAddresses,
    });

    logInfo('email.sent', {
      to: Array.isArray(to) ? to.map(maskEmail) : maskEmail(to),
      subject,
      messageId: info.messageId,
    });
    return { data: { id: info.messageId }, error: null };
  } catch (err) {
    logError('email.send_failed', {
      to: Array.isArray(to) ? to.map(maskEmail) : maskEmail(to),
      subject,
      error: err,
    });
    return {
      data: null,
      error: { message: (err as Error).message, name: 'SendError' },
    };
  }
}
