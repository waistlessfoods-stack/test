import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('⚠️  RESEND_API_KEY is not set. Email functionality will be disabled.');
}

export const resend = new Resend(apiKey);
export const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Email sending helper following the { data, error } pattern
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
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not configured');
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

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html: emailHtml,
    replyTo: replyTo || fromEmail,
  });

  if (error) {
    console.error('❌ Failed to send email:', error);
    return { data: null, error };
  }

  console.log('✅ Email sent successfully:', data?.id);
  return { data, error: null };
}
