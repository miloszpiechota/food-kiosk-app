# Payment Requirements

## Purpose
Define the payment-related expectations for the Food Ordering Kiosk App MVP.

## Payment Scope
- `PAY-001`: The MVP shall use Stripe Checkout as the payment flow.
- `PAY-002`: The MVP shall use Stripe in test mode only.
- `PAY-003`: Real production payments are out of scope for the MVP.

## Checkout Flow
- `PAY-004`: The customer shall be able to review an order summary before starting payment.
- `PAY-005`: The customer shall be able to return from the checkout step before starting payment.
- `PAY-006`: The system shall create an order record before final payment confirmation using a non-final state such as `pending` or `awaiting_payment_confirmation`.
- `PAY-007`: After a successful payment flow, the customer shall see a confirmation screen with order number and payment status information.
- `PAY-008`: After confirmation, the kiosk should return to the start page automatically after a short delay.

## Payment Confirmation
- `PAY-009`: Payment shall be considered successful only after verified backend confirmation.
- `PAY-010`: The frontend success redirect shall be treated only as an informational or transitional state, not as final proof of payment success.
- `PAY-011`: The system shall support separate payment states such as `pending`, `paid`, `failed`, and `cancelled`.
- `PAY-012`: The system should support an explicit state for delayed verification, such as `awaiting_payment_confirmation`, when webhook confirmation has not yet been completed.

## Failure And Cancellation Handling
- `PAY-013`: If payment fails, the system shall inform the customer immediately using clear, non-technical messaging.
- `PAY-014`: If payment fails, the customer should be able to return to the previous order context without unnecessary frustration.
- `PAY-015`: If the customer closes or abandons the payment flow, the order shall not be marked as completed or paid.
- `PAY-016`: If the payment flow is abandoned, the active payment attempt or session should be treated as ended.
- `PAY-017`: If webhook confirmation is delayed for too long, the system shall avoid falsely confirming the payment and shall keep the order in a non-final state until verification is resolved.
- `PAY-018`: Customer-facing payment errors shall avoid raw technical details.

## Admin Visibility And Control
- `PAY-019`: The admin area should display payment status separately from order status.
- `PAY-020`: The admin area shall support visibility into non-final states such as pending or awaiting payment confirmation.
- `PAY-021`: The system may allow administrators to manage order states, but payment truth shall still depend on verified backend payment state rather than manual assumption.

## Validation And Security
- `PAY-022`: Payment amounts shall be calculated on the backend and not trusted from frontend input.
- `PAY-023`: Order contents shall be validated on the backend before creating a Stripe Checkout session.
- `PAY-024`: Stripe webhook payloads shall be verified using Stripe signature validation or equivalent recommended verification mechanisms.

## Out Of Scope And Later
- `PAY-025`: Refund handling is out of scope for the MVP and may be added later.
- `PAY-026`: Support for additional payment methods may be added later.
- `PAY-027`: Promo codes and discount flows are out of scope for the MVP.

## Notes
- These requirements define intended payment behavior and do not imply that payment functionality is already implemented.
- Keeping payment status and order status separate is recommended because an order can exist before payment is fully verified.
