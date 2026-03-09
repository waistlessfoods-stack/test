# React Email + Resend Integration Guide

## Components Location

All email templates are React components located in `lib/email/templates/`:

- `welcome-email.tsx` - New user welcome email
- `order-confirmation-email.tsx` - Order confirmation with items and totals
- `password-reset-email.tsx` - Password reset requests

## Component Directory Structure

```
lib/email/
├── resend.ts                                # Resend client & sendEmail helper
├── templates/
│   ├── welcome-email.tsx                   # Welcome email component
│   ├── order-confirmation-email.tsx        # Order confirmation component
│   └── password-reset-email.tsx            # Password reset component
└── templates.ts                            # ⚠️ Old HTML templates (deprecated)

app/api/email/
└── send/
    └── route.ts                            # Email API endpoint
```

## Integration Examples

### Send Welcome Email on Sign-Up

Add this to your sign-up API route (`app/api/auth/signup/route.ts` or similar):

```typescript
import { sendEmail } from '@/lib/email/resend';
import WelcomeEmail from '@/lib/email/templates/welcome-email';

// Inside your signup handler
const { data, error } = await sendEmail({
  to: newUser.email,
  subject: 'Welcome to Waistless Foods!',
  react: <WelcomeEmail name={newUser.name} />,
});

if (error) {
  console.error('Failed to send welcome email:', error);
  // Still allow signup, just log the email error
}
```

### Send Order Confirmation on Stripe Webhook

Add this to your Stripe webhook handler (`app/api/stripe/webhook/route.ts`):

```typescript
import { sendEmail } from '@/lib/email/resend';
import OrderConfirmationEmail from '@/lib/email/templates/order-confirmation-email';

// Inside your checkout.session.completed handler
async function handleCheckoutSessionCompleted(session: any, order: any) {
  // Prepare order items with prices
  const items = order.items.map((item: any) => ({
    name: item.title,
    price: `$${(item.price / 100).toFixed(2)}`,
    quantity: item.quantity,
  }));

  const { data, error } = await sendEmail({
    to: session.customer_email || order.customerEmail,
    subject: `Order Confirmation - #${order.id}`,
    react: (
      <OrderConfirmationEmail
        customerName={session.customer_details?.name || 'Valued Customer'}
        orderNumber={order.id}
        orderTotal={`$${(session.amount_total / 100).toFixed(2)}`}
        orderDate={new Date().toLocaleDateString()}
        items={items}
      />
    ),
  });

  if (error) {
    console.error('Failed to send order confirmation:', error);
    // Log this for manual follow-up
  }
}
```

### Send Password Reset Email

Add this to your password reset API route:

```typescript
import { sendEmail } from '@/lib/email/resend';
import PasswordResetEmail from '@/lib/email/templates/password-reset-email';

// Inside your password reset handler
const resetToken = generateToken(); // Your token generation
const resetLink = `https://waitslessfood.com/reset-password?token=${resetToken}`;

const { data, error } = await sendEmail({
  to: user.email,
  subject: 'Reset Your Password',
  react: (
    <PasswordResetEmail
      name={user.firstName || 'User'}
      resetLink={resetLink}
    />
  ),
});

if (error) {
  console.error('Failed to send password reset email:', error);
  throw new Error('Could not send password reset email');
}
```

## API Endpoint Usage

The email API is available at `POST /api/email/send` for programmatic sending:

### Test Welcome Email
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "test@example.com",
    "data": { "name": "John" }
  }'
```

### Test Order Confirmation
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order-confirmation",
    "to": "customer@example.com",
    "data": {
      "customerName": "John Doe",
      "orderNumber": "ORD-001",
      "orderTotal": "$49.99",
      "orderDate": "2026-03-09",
      "items": [
        {
          "name": "Premium Recipe Pack",
          "price": "$49.99",
          "quantity": 1
        }
      ]
    }
  }'
```

### Test Password Reset
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "password-reset",
    "to": "user@example.com",
    "data": {
      "name": "John",
      "resetLink": "https://waitslessfood.com/reset-password?token=abc123"
    }
  }'
```

## Customizing Email Templates

### Edit Welcome Email
File: `lib/email/templates/welcome-email.tsx`

```typescript
export interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      {/* Customize JSX here */}
    </Html>
  );
}
```

All templates use React Email components:
- `<Html>`, `<Body>`, `<Head>` - Wrapper components
- `<Container>` - Email width constraint
- `<Section>` - Content blocks
- `<Heading>`, `<Text>` - Typography
- `<Button>`, `<Link>` - Interactive elements
- `<Img>` - Images
- `<Hr>` - Dividers

See [React Email Components](https://react.email/components) for full reference.

## Testing Emails

### Use Resend Test Addresses

For safe testing without affecting your domain:

- `delivered@resend.dev` - Simulate successful delivery
- `bounced@resend.dev` - Simulate bounce
- `complained@resend.dev` - Simulate complaint  
- `suppressed@resend.dev` - Simulate suppression

### Preview Emails

Visit `GET /api/email/send` to see API documentation and examples.

## Error Handling

All email functions return `{ data, error }` pattern:

```typescript
const { data, error } = await sendEmail({...});

if (error) {
  console.error(`${error.name}: ${error.message}`);
  // Handle error (log, retry, notify user, etc.)
}

console.log(`Email sent with ID: ${data?.id}`);
```

Common error types:
- `ConfigError` - Missing API key
- `ValidationError` - Invalid email parameters
- `InvalidType` - Unknown email type
- `InternalError` - Resend API failure

## Production Checklist

- [ ] Verify domain at [https://resend.com/domains](https://resend.com/domains)
- [ ] Update `RESEND_FROM_EMAIL` to verified domain
- [ ] Test with real recipients
- [ ] Add error logging/monitoring
- [ ] Implement email sending with idempotency keys for retries
- [ ] Set up email templates in Resend dashboard (optional, for A/B testing)
- [ ] Configure DKIM/SPF/DMARC records for domain

## Useful Resources

- [React Email Documentation](https://react.email)
- [React Email Components Reference](https://react.email/components)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send)
- [Resend Domain Verification](https://resend.com/domains)
