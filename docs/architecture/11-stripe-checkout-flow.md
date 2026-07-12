# Stripe Checkout Flow

## Status

Implemented as the first Stripe test-payment slice.

This flow starts after Basket Review creates an immutable order snapshot. The frontend does not send prices to Stripe and does not mark an order as paid from a redirect.

## Endpoints

```txt
POST /api/v1/kiosk/orders/:orderId/checkout-session
POST /api/v1/webhooks/stripe
```

## Checkout Session Creation

1. The customer taps `Continue to payment` in Basket Review.
2. The frontend creates an order snapshot from the active basket through `POST /api/v1/kiosk/orders`.
3. The frontend calls `POST /api/v1/kiosk/orders/:orderId/checkout-session`.
4. The backend loads the stored order, order items, restaurant currency, and existing payment state.
5. The backend rejects empty, already-paid, invalid-amount, or missing orders.
6. The backend creates a Stripe Checkout Session in `payment` mode.
7. The backend persists or updates the order's one-to-one `Payment` row with:
   - `provider = STRIPE`
   - `providerSessionId = checkoutSession.id`
   - `status = AWAITING_PAYMENT_CONFIRMATION`
   - `amount = order.totalAmount`
   - `currency = restaurant.currencyCode`
8. The backend updates `Order.paymentStatus` to `AWAITING_PAYMENT_CONFIRMATION`.
9. The frontend redirects the browser to the returned Stripe Checkout URL.

## Payment Confirmation

Stripe payment truth is handled by webhook verification:

1. Stripe sends an event to `POST /api/v1/webhooks/stripe`.
2. Nest stores the raw request body through `rawBody: true`.
3. The webhook controller passes the raw body and `Stripe-Signature` header to the payment service.
4. The payment service verifies the event with `stripe.webhooks.constructEvent`.
5. Only verified checkout-session events update local payment state.

Mapped events:

```txt
checkout.session.completed
  payment_status = paid -> PAID
  otherwise -> AWAITING_PAYMENT_CONFIRMATION

checkout.session.async_payment_succeeded -> PAID
checkout.session.async_payment_failed    -> FAILED
checkout.session.expired                 -> CANCELLED
```

If an order is already `PAID`, later non-paid webhook events are ignored so a late cancellation or expiration cannot downgrade a confirmed payment.

## Frontend Redirects

Stripe redirects back to:

```txt
/?checkout=success&orderId=:orderId&session_id={CHECKOUT_SESSION_ID}
/?checkout=cancelled&orderId=:orderId
```

These redirects are informational only. They do not confirm payment. Final payment state remains whatever the verified webhook writes to the backend.

## Data Integrity Notes

- Checkout uses `Order.totalAmount`, copied from the backend-created order snapshot.
- The frontend never supplies Stripe amounts.
- Payment and order status are separate.
- `Payment.providerSessionId` is unique and is the primary local lookup for webhook updates.
- Creating a new checkout session for an unpaid order updates the existing `Payment` row for that order.
