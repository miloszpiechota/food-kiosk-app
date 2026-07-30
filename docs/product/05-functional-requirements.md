# Functional Requirements

## Purpose
Define the user-visible and system-visible capabilities required for the MVP of the Food Ordering Kiosk App.

## Customer Ordering
- `FR-001`: The system shall allow a customer to browse the menu from the kiosk interface.
- `FR-002`: The system shall allow a customer to search for products by name or keyword.
- `FR-003`: The system shall allow a customer to filter or browse products by category.
- `FR-004`: The system shall allow a customer to view details of a product before adding it to the basket.
- `FR-005`: The system shall support standalone products, meals, and large meals in the same catalog.
- `FR-006`: The system shall allow a customer to choose a meal or large meal and complete required group selections before adding it to the basket.
- `FR-007`: The system shall support required and optional meal groups such as sandwich, side, and drink selections.
- `FR-008`: The system shall allow a customer to personalize a selected product by adding or removing supported ingredients.
- `FR-009`: The system shall allow a customer to choose supported extra quantities for configurable ingredients.
- `FR-010`: The system shall validate that required meal and personalization selections are complete before a configured product can be added to the basket.
- `FR-011`: The system shall allow a customer to add one or more configured products to the basket.
- `FR-012`: The system shall allow a customer to update basket contents before checkout.
- `FR-013`: The system shall provide an order summary showing selected products, configuration details, and order totals before checkout.
- `FR-014`: The system shall allow a customer to proceed from the basket to checkout without creating an account or logging in.

## Payments And Orders
- `FR-015`: The system shall support Stripe Checkout in test mode for customer payments.
- `FR-016`: The system shall create an order record for a customer checkout attempt.
- `FR-017`: The system shall confirm payment status through a verified backend flow rather than relying only on the frontend redirect result.
- `FR-018`: The system shall store confirmed orders so they can be managed by restaurant administrators.

## Admin Access
- `FR-019`: The system shall allow a super admin to invite selected restaurant workers to the admin area.
- `FR-020`: The system shall provide an invite acceptance flow where admins set their own password and configure mandatory two-factor authentication.
- `FR-021`: The system shall restrict the admin area to authenticated administrators only.
- `FR-021A`: The system shall support `SUPER_ADMIN` and `ADMIN` roles.
- `FR-021B`: The system shall scope restaurant admin access to assigned restaurants.
- `FR-021C`: The system shall support email and password login followed by mandatory two-factor verification.

## Admin Order Management
- `FR-022`: The system shall allow an authenticated administrator to view incoming orders.
- `FR-023`: The system shall allow an authenticated administrator to review order details, including meal selections and product personalization.
- `FR-024`: The system shall allow an authenticated administrator to update order status.
- `FR-024A`: The system shall allow authenticated administrators to search and filter orders by restaurant, order number, order status, payment status, date range, and item text where practical.
- `FR-024B`: The system shall show crucial order details, including order id, order number, restaurant, ordered items, item ids, product ids, menu product ids, payment provider, payment identifiers, payment status, subtotal, total price, and timestamps.

## Accessibility And UI Controls
- `FR-025`: The system shall provide a kiosk-oriented interface that is clear and usable for touch-based ordering.
- `FR-026`: The system shall provide accessible navigation and visible focus indicators for supported interactions.
- `FR-027`: The system shall provide a user-facing contrast or theme option, such as light and dark mode, to improve usability and accessibility.
- `FR-028`: The system shall provide a language selection control on the first kiosk page or start screen.
- `FR-029`: The system shall apply the selected language to customer-facing kiosk text such as titles, subtitles, navigation, instructions, status messages, and error messages.
- `FR-030`: The system shall keep the selected language active through the current kiosk ordering flow.
- `FR-031`: The system shall reset the kiosk language to the configured default after order completion or kiosk session timeout so the next customer starts from a predictable state.

## Menu Structure And Availability
- `FR-032`: The system shall support many restaurants as owners of menus, categories, products, orders, and admin access.
- `FR-033`: The system shall support multiple menus per restaurant.
- `FR-034`: The system shall allow categories to be shared across menus.
- `FR-035`: The system shall allow products to be shared across menus and categories.
- `FR-036`: The system shall support menu-specific product pricing.
- `FR-037`: The system shall support date and time-based availability rules for menus.
- `FR-038`: The system shall support date and time-based availability rules for categories within menus.
- `FR-039`: The system shall support date and time-based availability rules for products within menus or menu categories.
- `FR-040`: The system shall allow an authenticated administrator to hide, unhide, or schedule menus, categories, and products.
- `FR-041`: The system shall prevent public kiosk responses from showing a meal or large meal when any required meal group has no visible and available option.
- `FR-042`: The system shall apply product hiding to meal-option availability, so hiding the only available product in a required group also makes affected meals unavailable to customers.

## Notes
- These requirements describe planned functionality and do not imply current implementation.
- Detailed meal and large-meal behavior is specified in [Meal Builder Requirements](./13-meal-builder-requirements.md).
- Admin authentication and order-management behavior is specified in [Admin Auth And Order Management](../architecture/12-admin-auth-and-order-management.md).
- Automated upsell recommendations are intentionally excluded from the current MVP functional scope and should be treated as Later.
- More detailed validation rules, security constraints, and accessibility standards should be defined in later discovery documents.
