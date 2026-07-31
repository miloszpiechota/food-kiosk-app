# Admin Auth And Order Management

## Status

Partially implemented.

Implemented now:

- `AdminAuthModule` with first super-admin bootstrap, bootstrap status, cancelable bootstrap setup, email/password login, mandatory TOTP challenge, password reset, invite creation, invite confirmation, session lookup, and logout.
- First super-admin setup is a two-step flow: account details first, then QR/manual TOTP enrollment and six-digit verification before the account becomes active.
- Admin sessions use opaque tokens, token hashes in the database, and HTTP-only cookies.
- Admin guards protect restaurant and menu-product endpoints.
- `SUPER_ADMIN` can invite `ADMIN` users and list admin users.
- Admin menu-product list and batch visibility save are backend-backed.
- Admin order list, search, filters, detail view, and status updates are backend-backed.
- Admin order status updates validate allowed workflow transitions on the backend.
- Kiosk catalog responses hide meals when a required meal group has no visible menu option.
- The frontend admin panel has login, first setup, invite confirmation, password reset, order search/filter/detail/status management, menu visibility save/reset controls, and a temporary dev-only bypass for UI work.

Still incomplete:

- Production email provider. Current local email delivery is console-backed.
- Production password hashing hardening. Current implementation uses Node `crypto.pbkdf2`; Argon2 is still preferred before production.
- Rate limiting, audit logging, recovery-code policy, and broader security hardening.
- Backend-backed restaurant management screens.
- Removal of the temporary dev-only admin bypass before production use.

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

Initial setup strategy:

- the first platform owner account is created through the protected bootstrap flow
- bootstrap is available only while no admin users exist, or after an unfinished bootstrap setup is canceled or expires and is cleaned up
- if `ADMIN_BOOTSTRAP_TOKEN` is configured, the user must provide it before moving to TOTP setup
- the first `SUPER_ADMIN` stays inactive until the TOTP QR/manual-key setup is verified with a six-digit authenticator code
- no public self-registration endpoint creates a super admin

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

Current flow:

1. `SUPER_ADMIN` opens admin user management.
2. `SUPER_ADMIN` enters email, temporary password, and restaurant access.
3. Backend creates an inactive `AdminUser`, TOTP secret, restaurant access rows, and an `AdminInvite`.
4. Backend stores only `tokenHash`, not the raw invite token.
5. Current local delivery writes the invite URL and manual TOTP key through the console-backed email provider.
6. Invited worker opens the invite link.
7. Backend marks the invite accepted and activates the already-created admin account.
8. Worker signs in with email, temporary password, and the TOTP code.

Production target:

- do not email passwords
- invited workers should set their own password during invite acceptance
- invite acceptance should include QR/manual TOTP enrollment and code verification before activation
- use a real transactional provider such as Resend, Postmark, SendGrid, or AWS SES

Recommended email providers:

- Resend
- Postmark
- SendGrid
- AWS SES

For this project, Resend is the simplest first production choice.

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
- QR code and manual TOTP setup key display for first super-admin setup
- TOTP verification form
- password reset form
- temporary dev-only bypass button for UI work; remove before production

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

The order list is dense and searchable. It intentionally returns summary rows rather than every nested order item so the table can stay fast and simple.

Current filters:

- restaurant
- order status
- payment status
- date range
- text search across order number and item names

Current row fields:

- order id
- order number
- restaurant
- order status
- payment status
- total amount
- payment provider
- created time
- item count

Current endpoint:

```txt
GET /api/v1/admin/orders?restaurantId=...&orderStatus=NEW&paymentStatus=PAID&dateFrom=...&dateTo=...&search=...
```

The list endpoint is necessary because the admin dashboard needs a lightweight, filterable table without loading full order-item snapshots for every row.

## Admin Order Detail

When an admin opens an order, the UI calls the detail endpoint to show the crucial operational and payment details.

Current detail fields:

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

Current endpoint:

```txt
GET /api/v1/admin/orders/:orderId
```

The detail endpoint is necessary because full order-item ids, payment provider ids, and configuration snapshots are heavier data that should be loaded only for the selected order.

## Admin Order Status Updates

Current endpoint:

```txt
PATCH /api/v1/admin/orders/:orderId/status
```

Current request:

```json
{
  "status": "IN_PROGRESS"
}
```

Allowed transitions:

- `NEW` -> `IN_PROGRESS`, `CANCELLED`
- `IN_PROGRESS` -> `READY`, `CANCELLED`
- `READY` -> `COMPLETED`, `CANCELLED`
- `COMPLETED` -> no further transition
- `CANCELLED` -> no further transition

The backend rejects invalid statuses, invalid order ids, orders outside the admin's restaurant access, and attempts to mark unpaid orders as `COMPLETED`.

## Admin Menu Search And Hide Rules

Admins need to search menu items and hide or unhide products for assigned restaurants.

Current implementation:

- `GET /api/v1/admin/menu-products` lists accessible menu products.
- `PATCH /api/v1/admin/menu-products/visibility` saves a batch of visibility changes.
- The frontend tracks unsaved visibility changes, supports reset to last saved state, and updates the table from the backend response after save.
- If a required meal group has no visible options after saving, the backend force-hides the affected meal record and returns `forcedHiddenMenuProductIds`.
- The kiosk catalog also dynamically filters meals out of category responses when a required group has no visible option.

Recommended public kiosk availability rule:

- a menu must be active and currently available
- a menu category must be visible and currently available
- a menu product must be visible and currently available
- the referenced product must be available
- for a meal or large meal, every required group must have at least one available option
- a group option is available only when `ProductGroupOption.isAvailable = true` and its referenced product is available

If an admin hides `Small Fries` and that product is the only visible option in the side group for a meal, the backend stops returning that meal in kiosk catalog responses.

Current implementation both:

- force-hides affected meal `MenuProduct` rows during admin visibility save
- defensively filters invalid meals from kiosk category/detail responses

Potential refinement:

- later, consider storing explicit admin visibility separately from computed orderability so the system can distinguish "manually hidden" from "temporarily unorderable because a required option is unavailable."

## Recommended Endpoint Shape

```txt
GET  /api/v1/admin/auth/bootstrap-status
POST /api/v1/admin/auth/bootstrap-super-admin
POST /api/v1/admin/auth/verify-bootstrap-2fa
POST /api/v1/admin/auth/cancel-bootstrap-setup
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/verify-2fa
POST /api/v1/admin/auth/confirm-invite
POST /api/v1/admin/auth/forgot-password
POST /api/v1/admin/auth/reset-password
GET  /api/v1/admin/auth/me
POST /api/v1/admin/auth/logout

GET  /api/v1/admin/users
POST /api/v1/admin/users/invite

GET  /api/v1/admin/restaurants
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:orderId
PATCH /api/v1/admin/orders/:orderId/status

GET  /api/v1/admin/menu-products
PATCH /api/v1/admin/menu-products/visibility
```

## Suggested Implementation Order

1. Refine invite acceptance so invited admins set their own password and enroll TOTP through QR/manual setup before activation.
2. Add a production email provider for invites and password resets.
3. Add rate limiting, audit logging, and recovery/lockout policy for login and TOTP attempts.
4. Replace or harden password hashing for production, preferably with Argon2.
5. Split stored admin visibility from computed meal orderability if the current force-hide behavior becomes too opaque.
6. Add pagination controls for admin order and menu-product lists.
7. Remove the temporary admin bypass before any production deployment.
8. Add end-to-end tests for admin login, first setup, invite acceptance, menu visibility save/reset, and order management.
