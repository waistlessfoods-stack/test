import { sendEmail } from '@/lib/email/resend';
import WelcomeEmail from '@/lib/email/templates/welcome-email';
import OrderConfirmationEmail from '@/lib/email/templates/order-confirmation-email';
import PasswordResetEmail from '@/lib/email/templates/password-reset-email';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!to || !type) {
      return NextResponse.json(
        { error: { message: 'Missing required fields: to, type', name: 'ValidationError' } },
        { status: 400 }
      );
    }

    let subject = '';
    let emailComponent: React.ReactElement | null = null;

    // Generate email component based on type
    switch (type) {
      case 'welcome':
        subject = 'Welcome to Waistless Foods!';
        emailComponent = React.createElement(WelcomeEmail, {
          name: data?.name || 'Friend',
        });
        break;

      case 'order-confirmation':
        subject = `Order Confirmation - #${data?.orderNumber}`;
        emailComponent = React.createElement(OrderConfirmationEmail, {
          customerName: data?.customerName || 'Customer',
          orderNumber: data?.orderNumber || 'N/A',
          orderTotal: data?.orderTotal || '$0.00',
          items: data?.items || [],
          orderDate: data?.orderDate || new Date().toLocaleDateString(),
        });
        break;

      case 'password-reset':
        subject = 'Reset Your Password';
        emailComponent = React.createElement(PasswordResetEmail, {
          name: data?.name || 'User',
          resetLink: data?.resetLink || '',
        });
        break;

      default:
        return NextResponse.json(
          { error: { message: `Unknown email type: ${type}`, name: 'InvalidType' } },
          { status: 400 }
        );
    }

    // Send the email
    const { data: emailData, error } = await sendEmail({
      to,
      subject,
      react: emailComponent,
    });

    // Handle send errors
    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: emailData?.id,
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to send email',
          name: 'InternalError',
        },
      },
      { status: 500 }
    );
  }
}

// Example GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Email API powered by React Email + Resend',
    usage: {
      method: 'POST',
      endpoint: '/api/email/send',
      types: ['welcome', 'order-confirmation', 'password-reset'],
      examples: {
        welcome: {
          type: 'welcome',
          to: 'user@example.com',
          data: { name: 'John' },
        },
        orderConfirmation: {
          type: 'order-confirmation',
          to: 'customer@example.com',
          data: {
            customerName: 'John Doe',
            orderNumber: 'ORD-001',
            orderTotal: '$49.99',
            orderDate: new Date().toLocaleDateString(),
            items: [
              { name: 'Premium Recipe Pack', price: '$49.99', quantity: 1 },
            ],
          },
        },
        passwordReset: {
          type: 'password-reset',
          to: 'user@example.com',
          data: {
            name: 'John',
            resetLink: 'https://waitslessfood.com/reset-password?token=abc123',
          },
        },
      },
    },
  });
}
