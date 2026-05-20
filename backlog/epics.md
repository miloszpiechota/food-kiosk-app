# Epics

## Purpose
This document groups the planned MVP work into major delivery areas for the Food Ordering Kiosk App.

## EPIC-001: Kiosk Catalog Browsing And Configuration
Enable customers to browse the restaurant catalog through a kiosk-style interface, including categories, search, configurable meals, and product personalization.

### Scope
- Product listing
- Category browsing
- Search
- Language selection from the kiosk start screen
- Localized customer-facing kiosk copy
- Product details
- Standalone products, meals, and large meals
- Meal group selection
- Ingredient personalization
- Touch-friendly kiosk presentation

## EPIC-002: Basket And Checkout
Allow customers to add configured products to a basket, review the order summary, and move through a clear checkout flow.

### Scope
- Add configured products to basket
- Update basket contents
- Order summary
- Clear ordering steps
- Return to previous step before payment

## EPIC-003: Stripe Test Payment Flow
Support Stripe Checkout in test mode with secure backend-driven payment confirmation and customer payment status feedback.

### Scope
- Stripe Checkout session creation
- Pending and confirmed payment states
- Webhook-based verification
- Payment success and failure handling
- Return to kiosk start screen after completion

## EPIC-004: Admin Authentication
Provide secure administrator access to the protected admin area.

### Scope
- Admin registration
- Admin login
- Session handling
- Auto logout behavior
- Protected admin routes

## EPIC-005: Admin Order Management
Allow administrators to view and manage incoming kiosk orders.

### Scope
- Order list
- Order details
- Order status management
- Payment status visibility

## EPIC-006: Accessibility Foundation
Establish the accessibility-oriented foundations of the kiosk and admin experiences.

### Scope
- Keyboard navigation support
- Visible focus states
- Touch-friendly controls
- Clear feedback and messaging
- Light and dark mode direction
- Large text and contrast-related improvements

## EPIC-007: Security And Validation Foundation
Establish secure handling of authentication, admin access, input validation, and payment-related integrity.

### Scope
- Secure password handling
- Backend validation
- Protected admin access
- Safe error messaging
- Secure payment state handling

## EPIC-008: Project Infrastructure And Quality
Support development with a maintainable monorepo structure, documentation, testing direction, and CI-ready workflows.

### Scope
- Monorepo project structure
- Shared configuration
- Documentation structure
- CI workflow
- Quality scripts
- Environment configuration

## EPIC-009: Menu Structure And Availability
Support one restaurant with multiple menus, reusable categories and products, menu-specific pricing, and scheduled availability.

### Scope
- One restaurant as the root business owner
- Multiple menus
- Shared categories across menus
- Shared products across menus and categories
- Menu-specific product pricing
- Date and time-based menu availability
- Date and time-based category availability inside menus
- Date and time-based product availability inside menus
- Admin controls for hide, unhide, and scheduling

## Later / Post-MVP

### EPIC-LATER-001: Upsell Recommendations
Introduce recommendation behavior that suggests complementary products before the customer finalizes basket choices.

#### Scope
- Recommendation rules for related products
- Customer-facing upsell prompts
- Accept or dismiss upsell suggestions
- Clear separation from mandatory ordering flow

## Notes
- These epics describe planned work and do not indicate completed implementation.
- User stories and technical tasks should be derived from these epics in the next planning step.
