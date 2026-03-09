# Order System & Stripe Integration Setup

## Overview

The application now requires users to create an account before checkout. All purchases are tracked in the database with full Stripe payment details.

## Features

✅ **Authentication Required** - Users must sign in or create an account before checkout
✅ **Order History** - Users can view all their past purchases at `/orders`
✅ **Stripe Payment Tracking** - Full payment intent and session details stored
✅ **Order Status Updates** - Real-time order status via Stripe webhooks
✅ **Automatic Redirects** - Seamless auth flow with return-to-page after login

## Database Setup

### 1. Apply the Migration

Run the database migration to create the `orders` table:

```bash
yarn drizzle-kit push
```

The migration creates the following table:
- `id` - Auto-incrementing order ID
- `userId` - Reference to authenticated user
- `stripeSessionId` - Stripe checkout session ID
- `stripePaymentIntentId` - Stripe payment intent ID
- `status` - Order status (pending, completed, failed, refunded)
- `amount` - Total amount in cents
- `currency` - Payment currency
- `items` - JSON array of purchased items
- `customerEmail` - Customer email
- `metadata` - Additional Stripe metadata
- `createdAt` / `updatedAt` - Timestamps

## Stripe Configuration

### 2. Environment Variables

Add these to your `.env.local`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (for localhost testing)
STRIPE_WEBHOOK_SECRET=whsec_...

# Better Auth (if not already set)
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Stripe Webhook Setup

#### For Local Development:

1. Install the Stripe CLI (if not already installed):
   ```bash
   brew install stripe/stripe-cli/stripe
   # or follow https://docs.stripe.com/stripe-cli
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local app:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (`whsec_...`) and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

#### For Production:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to your production environment variables

## User Flow

### Checkout Flow:

1. **Browse Products** → User adds items to cart on `/shop`
2. **Click Checkout** → System checks authentication
3. **Not Signed In?** → Redirect to `/signin` with return URL
4. **Create Account** → User signs up at `/signup`
5. **Authenticate** → Redirect back to shop/cart
6. **Checkout** → Create pending order and redirect to Stripe
7. **Payment** → User completes payment on Stripe
8. **Webhook** → Order status updated to "completed"
9. **Success** → Redirect to `/orders?success=1`

### Order History:

- Accessible at `/orders` (authentication required)
- Shows all user purchases with:
  - Order ID and status
  - Purchase date
  - Items purchased with images
  - Total amount
  - Stripe payment details
  - Payment intent ID

## API Endpoints

### `POST /api/stripe/checkout`
Create a checkout session (requires authentication)
- Request: `{ items: CartItem[] }`
- Response: `{ url: string }` (Stripe checkout URL)
- Error 401: User not authenticated

### `POST /api/stripe/webhook`
Handle Stripe webhook events
- Events: `checkout.session.completed`, `payment_intent.*`
- Updates order status in database

### `GET /api/orders`
Fetch user's order history (requires authentication)
- Response: `{ orders: Order[] }`
- Error 401: User not authenticated

## Testing

### Test the Checkout Flow:

1. Start the app:
   ```bash
   yarn dev
   ```

2. In another terminal, start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Create an account at `/signup`
4. Add items to cart on `/shop`
5. Click "Checkout" and complete payment with test card:
   - Card: `4242 4242 4242 4242`
   - Exp: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

6. Check `/orders` to see your order history

### Verify Webhooks:

Check the terminal running `stripe listen` to see webhook events:
```
✔ Received event checkout.session.completed (evt_...)
✔ Received event payment_intent.succeeded (evt_...)
```

## Troubleshooting

### "You must be signed in to checkout"
- User needs to create an account or sign in
- Check that Better Auth is configured correctly
- Verify `BETTER_AUTH_SECRET` is set

### "Stripe secret key is not configured"
- Add `STRIPE_SECRET_KEY` to `.env.local`
- Restart the dev server

### Orders not updating status
- Check webhook secret is correct
- Verify webhook is being received (check Stripe CLI output)
- Check server logs for errors in `/api/stripe/webhook`

### Database connection issues
- Verify database URL is correct
- Check database is accessible
- Run `yarn drizzle-kit push` to apply migrations

## Security Notes

- All checkout requests require authentication
- Order data is user-scoped (users only see their own orders)
- Webhook signatures are verified to prevent tampering
- Stripe handles all payment processing (PCI compliant)
- Use environment variables for all secrets

## Next Steps

Optional enhancements you can add:

- [ ] Email order confirmations
- [ ] PDF invoice generation
- [ ] Refund handling
- [ ] Order status notifications
- [ ] Admin dashboard for order management
- [ ] Digital product delivery (send recipe PDFs)
