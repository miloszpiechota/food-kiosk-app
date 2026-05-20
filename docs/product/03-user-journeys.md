# User Journeys

## Journey 1: Kiosk Ordering Flow

### Goal
Allow a kiosk customer to find menu items, place an order, complete a test payment, and ensure the order becomes available for restaurant administration.

### Primary Actor
Kiosk Customer

### Supporting Actor
Restaurant Admin

### Flow
1. The customer opens the kiosk ordering interface.
2. The customer browses the menu.
3. The customer searches for items or filters products by category.
4. The customer selects one or more menu items.
5. The customer adds items to the basket.
6. The customer reviews the basket and order summary.
7. The customer proceeds to checkout.
8. The customer completes a Stripe test payment flow.
9. The backend verifies and confirms the payment status.
10. The order is stored with a confirmed payment state.
11. The order appears in the restaurant admin management view.

### Expected Outcome
- The customer can complete an order without confusion.
- The basket and summary remain clear before payment.
- Payment is not treated as confirmed only from the frontend redirect.
- The admin can see the resulting order for follow-up and status management.

### Notes
- This journey describes intended system behavior during discovery.
- Stripe usage is limited to test mode.
- Real production payments are out of scope at this stage.
