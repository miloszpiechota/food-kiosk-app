# User Journeys

## Journey 1: Kiosk Ordering Flow

### Goal
Allow a kiosk customer to find products, configure meals and personalizations, place an order, complete a test payment, and ensure the order becomes available for restaurant administration.

### Primary Actor
Kiosk Customer

### Supporting Actor
Restaurant Admin

### Flow
1. The customer opens the kiosk ordering interface.
2. The system shows the currently available menu and categories based on scheduling and visibility rules.
3. The customer searches for products or filters the catalog by category.
4. The customer selects a standalone product, meal, or large meal.
5. If the customer selected a meal, the customer chooses required group selections such as sandwich, side, and drink.
6. The customer personalizes the selected product or meal by adding or removing ingredients and choosing supported extra quantities.
7. The customer reviews the configured selection and adds it to the basket.
8. The customer reviews the basket and order summary.
9. The customer proceeds to checkout.
10. The customer completes a Stripe test payment flow.
11. The backend verifies and confirms the payment status.
12. The order is stored with a confirmed payment state.
13. The order appears in the restaurant admin management view.

### Expected Outcome
- The customer can complete an order without confusion.
- The basket and summary remain clear before payment.
- Meal-building and product personalization remain understandable and guided.
- Only available menus, categories, and products are presented to the customer.
- Payment is not treated as confirmed only from the frontend redirect.
- The admin can see the resulting order for follow-up and status management.

### Notes
- This journey describes intended system behavior during discovery.
- Future upsell recommendations may be shown before basket confirmation in a later phase, but they are not part of the MVP.
- Stripe usage is limited to test mode.
- Real production payments are out of scope at this stage.
