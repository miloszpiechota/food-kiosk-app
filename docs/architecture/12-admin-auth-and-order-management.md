# Admin Auth And Order Management

## Status

Planned next implementation slice.

The current customer kiosk flow is implemented through order snapshot creation and Stripe test-payment confirmation. The next admin milestone is multi-restaurant admin access, invite-based onboarding, mandatory two-factor authentication, and restaurant-scoped order/menu operations.

## Goals

- Support many restaurants in one platform.
- Allow the company owner to act as the first `SUPER_ADMIN`.
- Let `SUPER_ADMIN` invite selected restaurant workers.
- Require two-factor authentication for every admin account.
- Keep admin access separate from the customer kiosk flow.
- Let admins list, filter, search, and inspect orders.
- Let admins update order workflow status and see payment state.
- Let authorized admins hide or unhide menu products without breaking meal availability rules.

## Roles

### `SUPER_ADMIN`

Company-level role.

Allowed responsibilities:

- invite new admin users
- manage restaurant access assignments
- manage orders for allowed restaurants
- see payment status and payment provider details
- search and filter orders
- hide and unhide menu products
- deactivate admin users

Initial seed strategy:

- the first platform owner account should be seeded or created through a protected setup command as `SUPER_ADMIN`
- no public self-registration endpoint should create a super admin

### `ADMIN`

Restaurant-scoped operational role.

Allowed responsibilities:

- view orders for assigned restaurants
- search and filter orders for assigned restaurants
- open order details
- update order workflow status
- see payment status separately from order status
- search menu items for assigned restaurants
- hide and unhide menu products for assigned restaurants

`ADMIN` must never access restaurants they are not assigned to.

## Invite-Based Onboarding

Do not email passwords.

Recommended flow:

1. `SUPER_ADMIN` opens admin user management.
2. `SUPER_ADMIN` enters email, role, and restaurant access.
3. Backend creates an `AdminInvite` with a high-entropy random token.
4. Backend stores only `tokenHash`, not the raw invite token.
5. Backend sends an email with an invite link.
6. Invited worker opens the link.
7. Worker sets their own password.
8. Backend stores the password using a strong password hash such as Argon2.
9. Backend creates a TOTP secret for the worker.
10. Frontend displays the manual authenticator setup key.
11. Worker adds the key to Google Authenticator and enters the current six-digit code.
12. Backend verifies the code and enables two-factor authentication.
13. Invite is marked accepted and the admin account becomes active.

Recommended email providers:

- Resend
- Postmark
- SendGrid
- AWS SES

For this project, Resend is the simplest first choice.

## Login Options

### Option 1: Email, Password, And 2FA

This is the required baseline login.

1. Admin enters email and password.
2. Backend verifies password.
3. Backend creates a short-lived login challenge and returns `MFA_REQUIRED`.
4. Admin enters a six-digit TOTP code from Google Authenticator.
5. Backend verifies the challenge and TOTP code.
6. Backend creates the final admin session.

The final session must not be issued before TOTP is verified.

Admin access uses email, password, and mandatory TOTP verification only.

## Recommended Auth Technology

Backend:

- NestJS module: `AdminAuthModule`
- current first implementation:
  - password hashing: Node `crypto.pbkdf2` with per-password salt
  - TOTP: local RFC 6238-compatible service using Node `crypto`
  - sessions: opaque random token stored as `AdminSession.tokenHash`, delivered in the response and as an HTTP-only cookie
  - email: console-backed provider for local development
- future production provider swaps:
  - password hashing: `argon2`
  - TOTP helper library: `otplib`
  - email: Resend or another transactional email provider

Frontend:

- login form
- invite acceptance form
- manual TOTP setup key display
- TOTP verification form

## Session Rules

- Use secure HTTP-only cookies for admin sessions.
- Store session token hashes, not raw tokens.
- Support explicit logout by revoking the session.
- Expire sessions automatically.
- Use short expiration for login challenges and invite tokens.
- Rate-limit login and TOTP verification attempts.

## Multi-Restaurant Access

The current schema already stores menus under restaurants through `menus.restaurant_id`. Multi-restaurant admin support requires scoping all admin reads and writes by restaurant access.

Recommended access model:

- `Restaurant` owns menus, categories, products, orders, and payments through existing relationships.
- `AdminRestaurantAccess` assigns an admin user to one or more restaurants.
- `SUPER_ADMIN` may either have explicit access rows or platform-wide access.
- `ADMIN` must have explicit access rows.

All admin endpoints must enforce restaurant access before returning or mutating data.

## Admin Order List

The order list should be dense and searchable.

Recommended filters:

- restaurant
- order status
- payment status
- order number
- date range
- payment provider
- text search across order number and item names

Recommended row fields:

- order id
- order number
- restaurant
- order status
- payment status
- total amount
- payment provider
- created time
- item count

## Admin Order Detail

When an admin opens an order, show the crucial operational and payment details.

Recommended detail fields:

- order id
- order number
- restaurant id and restaurant name
- order status
- payment status
- subtotal amount
- total amount
- created and updated timestamps
- payment id
- payment provider
- provider session id
- provider payment intent id
- payment amount
- payment currency
- ordered items
- item ids
- product ids
- menu product ids
- product names
- product types
- unit prices
- quantities
- line totals
- configuration snapshots rendered as readable meal groups and modifiers

Do not expose secrets or raw webhook payloads in the admin UI.

## Admin Menu Search And Hide Rules

Admins need to search menu items and hide or unhide products for assigned restaurants.

Recommended public kiosk availability rule:

- a menu must be active and currently available
- a menu category must be visible and currently available
- a menu product must be visible and currently available
- the referenced product must be available
- for a meal or large meal, every required group must have at least one available option
- a group option is available only when `ProductGroupOption.isAvailable = true` and its referenced product is available

If an admin hides `Small Fries` and that product is the only available option in the side group for a meal, the backend should stop returning that meal in kiosk catalog responses.

Prefer dynamic orderability calculation over physically auto-hiding the meal record. This avoids hidden side effects and makes the reason visible to admin tooling later.

## Recommended Endpoint Shape

```txt
POST /api/v1/admin/auth/invites
POST /api/v1/admin/auth/invites/:token/accept
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/totp/verify
POST /api/v1/admin/auth/logout
GET  /api/v1/admin/auth/me

GET  /api/v1/admin/restaurants
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:orderId
PATCH /api/v1/admin/orders/:orderId/status

GET  /api/v1/admin/menu-products
PATCH /api/v1/admin/menu-products/:menuProductId/visibility
```

## Suggested Implementation Order

1. Update Prisma schema for `SUPER_ADMIN`, invites, 2FA fields, login challenges, and restaurant access.
2. Seed or bootstrap the first `SUPER_ADMIN`.
3. Implement invite creation and invite acceptance.
4. Implement password login plus mandatory TOTP verification.
5. Add admin guards and restaurant-scope authorization.
6. Build admin login, invite acceptance, and TOTP setup screens.
7. Build admin order list and detail endpoints.
8. Build admin order list/detail UI.
9. Build menu search and hide/unhide endpoints.
10. Add dynamic meal orderability filtering for hidden group options.
