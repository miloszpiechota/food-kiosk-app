# Stripe Test Payments Setup

## Purpose

Configure local Stripe Checkout test mode for the kiosk payment slice.

## Environment

Set these values in the root `.env` file:

```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_local_or_dashboard_secret
STRIPE_PUBLIC_KEY=pk_test_your_key
FRONTEND_URL=http://localhost:5173
PORT=4000
```

Rules:

- Use Stripe test mode only.
- `STRIPE_SECRET_KEY` must start with `sk_test_`.
- `STRIPE_WEBHOOK_SECRET` must start with `whsec_`.
- Do not commit real Stripe keys.

## Local Webhook Forwarding

With the API running on port `4000`, forward Stripe events to the local webhook endpoint:

```bash
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

If you want to listen only for the events this app handles, quote the comma-separated list in PowerShell:

```powershell
stripe listen --events "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired" --forward-to localhost:4000/api/v1/webhooks/stripe
```

The `whsec_...` printed by `stripe listen` is specific to that local forwarding session. If you restart `stripe listen` and it prints a new secret, update `.env` and restart the API.

## Local Run Order

1. Start the database.
2. Apply Prisma migrations.
3. Seed the catalog if needed.
4. Start the API.
5. Start the web app.
6. Start Stripe webhook forwarding.
7. Place an order from the kiosk UI.
8. Continue to Stripe Checkout and pay with a Stripe test card.
9. Confirm the API receives the webhook and updates `orders.payment_status`.

## End-to-End Test Payment

Use Stripe's standard successful test card in Checkout:

```txt
Card number: 4242 4242 4242 4242
Expiry: any future date, for example 12/34
CVC: any three digits, for example 123
ZIP/postal code: any value, for example 00-001
```

Full manual test:

1. Confirm the API is running on `http://localhost:4000`.
2. Confirm the web app is running on `http://localhost:5173`.
3. Confirm `stripe listen` is forwarding to `localhost:4000/api/v1/webhooks/stripe`.
4. Open `http://localhost:5173`.
5. Start a kiosk order.
6. Add at least one item to the basket.
7. Open Basket Review.
8. Select `Continue to payment`.
9. Complete Stripe Checkout with `4242 4242 4242 4242`.
10. Return to the app after Stripe redirects.
11. Check the Stripe listener output for a successful webhook delivery.

Expected Stripe CLI output:

```txt
checkout.session.completed [evt_...]
<--  [200] POST http://localhost:4000/api/v1/webhooks/stripe [evt_...]
```

Stripe accepts any `2xx` response. This app explicitly returns `200` for the webhook endpoint.

Expected database state after the webhook:

```sql
select order_number, payment_status
from orders
order by created_at desc
limit 1;
```

```txt
payment_status = paid
```

You can also inspect the payment row:

```sql
select provider, provider_session_id, provider_payment_intent_id, status, amount, currency
from payments
order by created_at desc
limit 1;
```

```txt
provider = stripe
status = paid
```

The Stripe redirect back to the frontend is informational only. The order is considered paid only after the verified webhook updates `orders.payment_status` and `payments.status`.

## Implemented Local Endpoints

```txt
POST /api/v1/kiosk/orders/:orderId/checkout-session
POST /api/v1/webhooks/stripe
```

The Checkout Session endpoint returns:

```json
{
  "orderId": "order-id",
  "paymentId": "payment-id",
  "checkoutSessionId": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "paymentStatus": "AWAITING_PAYMENT_CONFIRMATION"
}
```

## Troubleshooting

`STRIPE_NOT_CONFIGURED`
: Set a real Stripe test secret key in `.env`.

`STRIPE_WEBHOOK_NOT_CONFIGURED`
: Run `stripe listen` and copy the local `whsec_...` value.

`STRIPE_SIGNATURE_INVALID`
: The webhook secret does not match the source of the forwarded event, or the raw request body was changed before verification.

`ORDER_ALREADY_PAID`
: The order has already reached `PAID` and cannot start another checkout session.

`INVALID_ORDER_AMOUNT`
: The stored order total cannot be converted to Stripe minor units.
