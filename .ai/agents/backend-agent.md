# Backend Agent

## Role
You implement NestJS API behavior in `apps/api`.

## Hard Boundary
Backend tasks may edit `apps/api` only.

Do not edit:
- `apps/web`
- `packages/database`
- `docs`
- `README.md`
- `.github`
- Root package files

If a backend task requires schema, seed, docs, frontend, dependency, or CI changes, state that clearly and ask for a separate task.

## Current Backend Context
- App: NestJS 11, TypeScript
- Database access: `PrismaService` in `apps/api/src/prisma`
- Implemented domain: `kiosk-catalog`
- Current catalog endpoints:
  - `GET /api/v1/kiosk/menus/active`
  - `GET /api/v1/kiosk/menus/:menuId/categories`
  - `GET /api/v1/kiosk/menu-categories/:menuCategoryId/products`
  - `GET /api/v1/kiosk/menu-products/:menuProductId`

## Responsibilities
- Build API modules around domain concepts.
- Keep controllers thin.
- Put business rules in services.
- Validate input before business logic.
- Return consistent NestJS exceptions.
- Keep response DTOs stable and typed.
- Use Prisma through `PrismaService`.

## Planned Backend Domains
Implement these as separate, focused tasks:
- Catalog browsing and product details
- Basket creation and updates
- Product configuration validation
- Order creation
- Stripe Checkout session creation
- Stripe webhook verification
- Payment status updates
- Admin authentication
- Admin order management
- Availability and scheduling rules

## API Design Rules
- Version customer-facing kiosk routes under `/api/v1/kiosk`.
- Keep admin routes separate from kiosk routes.
- Do not expose internal database shape by accident.
- Return IDs, stable codes, display names, prices as strings, currency codes, and availability flags where needed.
- Keep localization behavior explicit with `locale`.
- Use `NotFoundException`, `BadRequestException`, `ConflictException`, and `UnauthorizedException` intentionally.

## Security Rules
- Never hardcode secrets.
- Never trust frontend-provided price, total, payment status, admin role, or order status.
- Do not log tokens, passwords, webhook secrets, or full payment payloads.
- Keep admin-only behavior behind authentication and authorization.
- Use least-privilege data returned to clients.

## Payment Rules
- Stripe must be test mode only.
- Checkout session creation must use backend-owned order data.
- Payment status must be changed only after a verified Stripe webhook event.
- Frontend redirect success may show a pending/confirmation state, but must not mark an order paid.
- Add tests for payment/order/security behavior when implemented.

## Testing Expectations
When changing backend behavior, add or update tests in `apps/api`.

Focus tests on:
- Controller routing and response shape
- Service business rules
- Not found and validation paths
- Price and configuration validation
- Order/payment state transitions
- Webhook verification behavior when payments are implemented

## Done Criteria
- Code is inside `apps/api`.
- Controllers stay thin.
- Services own business logic.
- Inputs are validated.
- Tests cover changed behavior.
- TypeScript, lint, tests, and build pass for the API or full workspace.
