# Resend + React Email Integration

This project uses [Resend](https://resend.com) for sending transactional emails and [React Email](https://react.email) for building beautiful email components.

## Setup

### 1. Environment Variables
Your Resend API key is configured in `.env`:
```
RESEND_API_KEY=re_jkD4itrg_BypbFHrzJ4Nq4Sf33yopVVzi
RESEND_FROM_EMAIL=onboarding@resend.dev
```

⚠️ **Production Domain:** Replace `onboarding@resend.dev` with your verified domain at [https://resend.com/domains](https://resend.com/domains)

Format: `"Waistless Foods <noreply@yourdomain.com>"`

### 2. Installed Packages
```bash
yarn add resend @react-email/components react-email  # ✅ Already installed
```

## Usage

### Using React Email Components

React Email templates are built with React components for better maintainability and design consistency.

#### Welcome Email
```typescript
import { sendEmail } from '@/lib/email/resend';
import WelcomeEmail from '@/lib/email/templates/welcome-email';

const { data, error } = await sendEmail({
  to: 'newuser@example.com',
  subject: 'Welcome to Waistless Foods!',
  react: <WelcomeEmail name="John" />,
});

if (error) {
  console.error('Welcome email failed:', error);
}
```

#### Order Confirmation Email
```typescript
import { sendEmail } from '@/lib/email/resend';
import OrderConfirmationEmail from '@/lib/email/templates/order-confirmation-email';

const { data, error } = await sendEmail({
  to: 'customer@example.com',
  subject: 'Order Confirmation - #ORD-001',
  react: (
    <OrderConfirmationEmail
      customerName="John Doe"
      orderNumber="ORD-001"
      orderTotal="$49.99"
      orderDate={new Date().toLocaleDateString()}
      items={[{ name: 'Premium Recipe Pack', price: '$49.99', quantity: 1 }]}
    />
  ),
});

if (error) {
  console.error('Order confirmation failed:', error);
}
```

#### Password Reset Email
```typescript
import { sendEmail } from '@/lib/email/resend';
import PasswordResetEmail from '@/lib/email/templates/password-reset-email';

const { data, error } = await sendEmail({
  to: 'user@example.com',
  subject: 'Reset Your Password',
  react: (
    <PasswordResetEmail
      name="John"
      resetLink="https://waitslessfood.com/reset-password?token=abc123"
    />
  ),
});

if (error) {
  console.error('Password reset email failed:', error);
}
```

### Plain HTML Email (without React)

For simple HTML emails without React:

```typescript
import { sendEmail } from '@/lib/email/resend';

const { data, error } = await sendEmail({
  to: 'user@example.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
});
```

## API Endpoint

Ready-to-use endpoint for sending emails:

**Endpoint:** `POST /api/email/send`

Returns: `{ data: { id: string }, error: null }` or `{ data: null, error: { message, name } }`

### Welcome Email Example
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "test@example.com",
    "data": { "name": "John" }
  }'
```

### Order Confirmation Example
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
        { "name": "Premium Recipe Pack", "price": "$49.99", "quantity": 1 }
      ]
    }
  }'
```

## Integration Examples

### Send Email on User Signup
```typescript
import { sendEmail } from '@/lib/email/resend';
import { welcomeEmailTemplate } from '@/lib/email/templates';

// Inside your signup handler
const { data, error } = await sendEmail({
  to: newUser.email,
  subject: 'Welcome to Waistless Foods!',
  html: welcomeEmailTemplate({ name: newUser.name }),
});

if (error) {
  console.error('Welcome email failed:', error);
}
```

### Send Email on Order Completion
Add this to your Stripe webhook handler (`app/api/stripe/webhook/route.ts`):

```typescript
import { sendEmail } from '@/lib/email/resend';
import { orderConfirmationTemplate } from '@/lib/email/templates';

// Inside checkout.session.completed handler
const { data, error } = await sendEmail({
  to: session.customer_email,
  subject: `Order Confirmation - #${order.id}`,
  html: orderConfirmationTemplate({
    customerName: session.customer_name || 'Customer',
    orderNumber: order.id,
    orderTotal: `$${(session.amount_total / 100).toFixed(2)}`,
    orderDate: new Date().toLocaleDateString(),
    items: order.items, // Your order items
  }),
});

if (error) {
  console.error('Order confirmation failed:', error);
  // Optionally, retry or log to error tracking service
}
```

## File Structure

```
lib/email/
├── resend.ts          # Resend SDK initialization & sendEmail helper
├── templates.ts       # Email template generators
└── ...

app/api/email/
├── send/
│   └── route.ts       # Email sending API endpoint
└── ...
```

## Error Handling

The SDK returns `{ data, error }` instead of throwing errors:

```typescript
const { data, error } = await sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
});

if (error) {
  // { message: string, name: string }
  console.error(`${error.name}: ${error.message}`);
} else {
  console.log(`Email sent (ID: ${data.id})`);
}
```

## Testing

### Test Email Addresses
Resend provides test addresses for simulating email events without affecting reputation:

- `delivered@resend.dev` - Simulate successful delivery
- `bounced@resend.dev` - Simulate bounce
- `complained@resend.dev` - Simulate complaint
- `suppressed@resend.dev` - Simulate suppression

Use these in development to safely test different scenarios.

### API Documentation
```bash
GET /api/email/send
```

This returns examples and supported email types.

## Production Checklist

- [ ] Verify your domain at [https://resend.com/domains](https://resend.com/domains)
- [ ] Update `RESEND_FROM_EMAIL` to use your verified domain
- [ ] Test emails with production recipients (use valid, verified addresses)
- [ ] Set up error logging/monitoring for failed sends
- [ ] Consider adding idempotency keys for retry safety
- [ ] Add rate limiting to API endpoint if making it public

## Important Notes

⚠️ **API Key Security:**
- Never commit `.env` to git (should be in `.gitignore`)
- Keep `RESEND_API_KEY` private and secure
- Rotate keys if compromised

📧 **Sender Domain:**
- Configure a verified domain instead of `onboarding@resend.dev`
- Use format: `"Company Name <noreply@yourdomain.com>"`
- This improves deliverability and branding

🔄 **Rate Limiting:**
- Default: 2 requests per second per team
- Contact [Resend support](https://resend.com/contact) for increases

## Useful Links

- [Resend Documentation](https://resend.com/docs)
- [Email API Reference](https://resend.com/docs/api-reference/emails/send)
- [Domain Verification](https://resend.com/domains)
- [React Email Integration](https://resend.com/docs/react-email)
