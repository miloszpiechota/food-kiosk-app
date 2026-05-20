# Application Structure

## Purpose
This document defines the intended project structure and responsibility boundaries inside the monorepo.

## Monorepo Layout
```txt
apps/
  web/        React frontend for kiosk and admin UI
  api/        NestJS backend API

packages/
  config/     shared configuration
  database/   Prisma schema, database utilities, and data access support
  eslint-config/ shared lint configuration
  types/      shared TypeScript types
  ui/         shared UI components and design primitives

docs/
  product/
  architecture/
  adr/
  testing/
  deployment/

backlog/
  epics.md
  user-stories.md

.ai/
  agents/
  prompts/
```

## apps/web
The frontend application should contain the user interfaces for both the kiosk customer flow and the protected admin area.

### Main Responsibilities
- Kiosk ordering UI
- Catalog browsing and search
- Localization and language-switching behavior for customer-facing kiosk text
- Display of active menus and scheduled availability
- Meal-building and product personalization UI
- Basket and order summary flow
- Stripe Checkout redirection flow
- Customer-facing success and failure states
- Admin login and registration UI
- Admin order management UI
- Accessibility-oriented interaction patterns

### Suggested Internal Areas
- `src/features/kiosk`
- `src/features/menus`
- `src/features/catalog`
- `src/features/product-configurator`
- `src/features/i18n`
- `src/features/basket`
- `src/features/checkout`
- `src/features/admin-auth`
- `src/features/admin-orders`
- `src/features/recommendations` later if upsell is implemented
- `src/components`
- `src/pages`
- `src/lib`
- `src/styles`

## apps/api
The backend application should own business logic, validation, security-sensitive operations, and external integrations.

### Main Responsibilities
- API endpoints
- Authentication and authorization
- Restaurant and menu management
- Catalog and product configuration rules
- Availability and scheduling rules
- Order lifecycle management
- Payment integration and webhook verification
- Backend validation
- Data persistence orchestration

### Suggested Internal Areas
- `src/modules/restaurant`
- `src/modules/menus`
- `src/modules/catalog`
- `src/modules/availability`
- `src/modules/product-configurator`
- `src/modules/orders`
- `src/modules/payments`
- `src/modules/auth`
- `src/modules/admin`
- `src/modules/recommendations` later if upsell logic is added
- `src/common`
- `src/config`

## packages/config
Shared configuration that may be reused across applications.

### Example Responsibilities
- Shared TypeScript configuration
- Shared tooling conventions
- Centralized app constants where appropriate
- Localization configuration such as supported languages and default locale

## packages/database
Shared database-related resources planned for Prisma and PostgreSQL.

### Example Responsibilities
- Prisma schema
- Database client setup
- Shared database utilities
- Migration-related support

## packages/eslint-config
Shared linting configuration for the monorepo.

## packages/types
Shared TypeScript types that can be reused between frontend and backend where appropriate.

### Example Responsibilities
- Shared DTO-style contracts used carefully across boundaries
- Restaurant and menu-related types
- Order-related types
- Catalog-related types
- Product configuration and modifier types
- Locale and translation key types where useful
- Payment status enums or shared domain labels where useful

## packages/ui
Reusable UI primitives and shared interface components for the frontend.

### Example Responsibilities
- Buttons
- Form controls
- Layout primitives
- Accessible UI building blocks
- Shared theme or design tokens

## Separation Principles
- Customer-facing kiosk flows and admin flows should be clearly separated in both routing and feature structure.
- Configurable product logic should remain separate from checkout and payment logic.
- Localization concerns should be centralized rather than duplicated across individual screens.
- Menu and availability concerns should be modeled explicitly instead of being hidden inside product-only logic.
- Backend modules should be organized around domain responsibilities rather than generic utility-only folders.
- Payment logic should remain isolated from general UI concerns and confirmed through backend-owned flows.
- Shared packages should contain reusable logic only when reuse is real and justified.
- The MVP should avoid premature abstraction, but future reuse should remain possible.

## Suggested Growth Path
Start with clear feature-based structure inside `apps/web` and module-based structure inside `apps/api`. Move logic into `packages/*` only when duplication or strong reuse becomes real.

## Status
Planned. This structure describes intended organization and may evolve during implementation.
