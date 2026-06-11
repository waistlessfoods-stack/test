import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import React from 'react';

const gmailUser = process.env.Email;
const gmailAppPassword = process.env.AppPassword;

if (!gmailUser || !gmailAppPassword) {
  console.warn('⚠️  Email or AppPassword env vars are not set. Email functionality will be disabled.');
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
    console.error('❌ Gmail credentials (Email / AppPassword) are not configured');
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
    console.error('❌ No email content provided (html or react)');
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

    console.log('✅ Email sent successfully:', info.messageId);
    return { data: { id: info.messageId }, error: null };
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    return {
      data: null,
      error: { message: (err as Error).message, name: 'SendError' },
    };
  }
}
