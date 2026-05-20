# Prisma Schema Design

## Purpose
This document defines how the database model should be represented in Prisma before the actual schema is written in `packages/database`.

## Goal
Translate the relational database design into a Prisma-friendly structure that is:
- explicit
- maintainable
- compatible with PostgreSQL
- safe for future migrations

## Target Location

Recommended database package structure:

```txt
packages/database/
  prisma/
    schema.prisma
    migrations/
  src/
    client.ts
```

## Prisma Conventions

### Model Naming
- Use `PascalCase` model names in Prisma.
- Use singular model names.
- Map Prisma models to PostgreSQL `snake_case` tables with `@@map`.

Examples:
- `Restaurant` -> `restaurants`
- `MenuProduct` -> `menu_products`
- `AdminSession` -> `admin_sessions`

### Field Naming
- Use `camelCase` field names in Prisma.
- Map fields to `snake_case` columns with `@map` when needed.

Examples:
- `restaurantId` -> `restaurant_id`
- `createdAt` -> `created_at`
- `defaultLocale` -> `default_locale`

### IDs
- Use UUID primary keys for application-owned records.
- In Prisma, prefer `String @id @default(uuid())` and map to PostgreSQL UUID.

### Timestamps
- Use `createdAt` and `updatedAt` on important business tables.
- Prefer Prisma `@default(now())` for creation timestamps.
- Prefer `@updatedAt` for mutable records where appropriate.

### Money
- Use Prisma `Decimal` for all money values.
- Keep money fields explicit:
  - `basePrice`
  - `menuPrice`
  - `priceAdjustment`
  - `removePriceAdjustment`
  - `extraUnitPrice`
  - `unitPrice`
  - `lineTotal`

### Snapshots
- Use Prisma `Json` for:
  - `basketItems.configurationSnapshot`
  - `orderItems.configurationSnapshot`

This is required because menu pricing, translations, and personalization rules can change after the basket or order is created.

## Prisma Model Inventory

### Restaurant And Menu
Planned Prisma models:
- `Restaurant`
- `Menu`
- `MenuTranslation`
- `Category`
- `CategoryTranslation`
- `Product`
- `ProductTranslation`
- `MenuCategory`
- `MenuProduct`

### Availability
Planned Prisma models:
- `MenuAvailabilityRule`
- `MenuAvailabilityException`
- `MenuCategoryAvailabilityRule`
- `MenuCategoryAvailabilityException`
- `MenuProductAvailabilityRule`
- `MenuProductAvailabilityException`

### Configurable Meals
Planned Prisma models:
- `ProductGroupTemplate`
- `ProductGroupTemplateTranslation`
- `ProductGroup`
- `ProductGroupOption`

### Ingredients And Personalization
Planned Prisma models:
- `Ingredient`
- `IngredientTranslation`
- `ProductIngredient`
- `ModifierGroup`
- `ModifierOption`

### Basket, Orders, Payments
Planned Prisma models:
- `Basket`
- `BasketItem`
- `Order`
- `OrderItem`
- `Payment`

### Admin
Planned Prisma models:
- `AdminUser`
- `AdminSession`

### Later
Planned later model:
- `UpsellRecommendationRule`

This should stay out of the first schema unless implementation actually starts.

## Relation Strategy

### Explicit Junction Models
Do not use implicit many-to-many relations for menu structure.

Use explicit models for:
- `MenuCategory`
- `MenuProduct`

Reason:
- menu-specific pricing lives on `MenuProduct`
- visibility lives on `MenuCategory` and `MenuProduct`
- availability relations attach to those assignments

### Product Reuse
The same `Product` can be:
- ordered standalone
- used as a meal option inside `ProductGroupOption`
- reused across multiple menus and categories

That means `Product` stays reusable, while menu context lives in `MenuProduct`.

### Meal Configuration
Use:
- `ProductGroupTemplate` for reusable logical group definitions
- `ProductGroup` for meal-specific assignments
- `ProductGroupOption` for the allowed selectable products in a meal group

### Ingredient Personalization
Use:
- `Ingredient` as reusable definition
- `ProductIngredient` as product-specific behavior and pricing
- `ModifierGroup` and `ModifierOption` for customer-facing personalization logic

## Enum Plan

Recommended Prisma enums:

### `ProductType`
- `ITEM`
- `MEAL`
- `LARGE_MEAL`

### `SelectionMode`
- `SINGLE`
- `MULTIPLE`

### `ModifierActionType`
- `REMOVE`
- `ADD`

### `BasketStatus`
- `ACTIVE`
- `CHECKED_OUT`
- `ABANDONED`
- `EXPIRED`

### `OrderStatus`
- `NEW`
- `IN_PROGRESS`
- `READY`
- `COMPLETED`
- `CANCELLED`

### `PaymentStatus`
- `PENDING`
- `AWAITING_PAYMENT_CONFIRMATION`
- `PAID`
- `FAILED`
- `CANCELLED`

### `PaymentProvider`
- `STRIPE`

### `AdminRole`
- `ADMIN`

### `AvailabilityOverrideType`
- `CLOSURE`
- `SPECIAL_OPENING`
- `MANUAL_OVERRIDE`

## Uniqueness Strategy

Use Prisma `@@unique` for:
- `Restaurant.slug`
- `Menu(restaurantId, code)`
- `Category(restaurantId, code)`
- `Product(restaurantId, sku)`
- `MenuTranslation(menuId, locale)`
- `CategoryTranslation(categoryId, locale)`
- `ProductTranslation(productId, locale)`
- `IngredientTranslation(ingredientId, locale)`
- `ProductGroupTemplateTranslation(productGroupTemplateId, locale)`
- `MenuCategory(menuId, categoryId)`
- `MenuProduct(menuCategoryId, productId)`
- `ProductIngredient(productId, ingredientId)`
- `Order.orderNumber`
- `Payment.providerSessionId`
- `AdminUser.email`
- `AdminSession.tokenId`

Optional:
- `Payment.orderId` unique if one payment row per order is enforced

## Index Strategy

Use Prisma `@@index` for:
- all foreign keys
- active/sort combinations used in kiosk reads
- order and payment operational queries
- admin session lookup and expiry queries

Important candidates:
- `Menu(restaurantId, isActive, sortOrder)`
- `MenuCategory(menuId, isVisible, sortOrder)`
- `MenuProduct(menuCategoryId, isVisible, sortOrder)`
- `Product(restaurantId, type, isAvailable)`
- `Order(createdAt)`
- `Order(status, paymentStatus)`
- `AdminSession(adminUserId, expiresAt, revokedAt)`

## Availability Modeling In Prisma

### Recurring Rules
Recurring rules need:
- optional date range
- day-of-week data
- local time window
- active flag

Recommended direction:
- keep recurring availability in dedicated rule models
- keep exception handling in separate exception models

### Exceptions
One-off exceptions like:
- holidays
- temporary closures
- one-day openings

should be represented by dedicated exception models, not overloaded into recurring rules.

### Implementation Note
The schema uses integer minute offsets from midnight for recurring local time windows.

The important architectural rule is to keep:
- recurring rules separate from exceptions
- menu/category/product availability separate by scope

## Snapshot Strategy In Prisma

### BasketItem
Store:
- `menuProductId`
- `productId`
- `productNameSnapshot`
- `unitPrice`
- `lineTotal`
- `configurationSnapshot`

### OrderItem
Store:
- `menuProductId`
- `productId`
- `productName`
- `productType`
- `unitPrice`
- `lineTotal`
- `configurationSnapshot`

Reason:
- menu-specific price may differ from product base price
- product configuration may change after purchase
- translations and labels may change later

## Mapping Strategy

Recommended pattern:

```prisma
model Restaurant {
  id            String   @id @default(uuid()) @db.Uuid
  defaultLocale String   @map("default_locale")

  @@map("restaurants")
}
```

Use `@@map` on every model and `@map` on columns that differ from Prisma naming.

## Migration Strategy

### First Migration Scope
The first Prisma migration should include:
- restaurant
- menus
- translations
- categories
- products
- menu assignments
- availability models
- meal configuration models
- ingredient and modifier models
- basket/order/payment models
- admin auth models

### Do Not Include Yet
- upsell recommendation tables
- analytics tables
- audit/history tables unless implementation needs them immediately

## Recommended Build Order

1. Write `schema.prisma`
2. Validate relations and enums
3. Generate Prisma client
4. Review migration SQL
5. Adjust indexes and constraints
6. Add seed strategy later

## Risk Notes

### Timezone And Scheduling
The hardest part of this schema is not relationships. It is schedule evaluation:
- recurring rules
- exceptions
- restaurant timezone
- kiosk display behavior

That logic should stay primarily in application code, not hidden in database-only assumptions.

### Snapshot Dependence
If basket and order snapshots are omitted or made too small, historical pricing and configuration accuracy will break.

### Menu Context
If basket and order lines do not preserve `menuProductId`, menu-specific price history becomes unreliable.

## Status
Planned. This document defines how the database model should be translated into Prisma before the actual schema file is written.
