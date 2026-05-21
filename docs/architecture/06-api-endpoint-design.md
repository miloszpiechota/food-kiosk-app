# API Endpoint Design

## Purpose

This document defines the API design rules for the Food Ordering Kiosk App before public or admin endpoints are implemented.

## Main Principles

- Use resource-oriented routes based on nouns, not verbs
- Separate kiosk, admin, and webhook concerns by route namespace
- Keep payment status and order status separate in responses and write flows
- Never expose raw database structure directly to clients
- Resolve visibility, availability, and localization on the backend
- Prefer stable DTOs over leaking Prisma model shapes

## Recommended Route Namespaces

### Public Kiosk

Use:

```txt
/api/v1/kiosk/*
```

Examples:

- `GET /api/v1/kiosk/menus/active`
- `GET /api/v1/kiosk/menus/:menuId/categories`
- `GET /api/v1/kiosk/menu-products/:menuProductId`
- `POST /api/v1/kiosk/baskets`
- `POST /api/v1/kiosk/baskets/:basketId/items`

This keeps the customer ordering flow isolated from admin behavior.

### Admin

Use:

```txt
/api/v1/admin/*
```

Examples:

- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/logout`
- `GET /api/v1/admin/orders`
- `PATCH /api/v1/admin/orders/:orderId/status`
- `GET /api/v1/admin/menus`

Admin endpoints should always require authentication and authorization.

### Webhooks

Use:

```txt
/api/v1/webhooks/*
```

Example:

- `POST /api/v1/webhooks/stripe`

Webhook routes should stay isolated from customer and admin route groups.

## Naming Rules

- Use plural nouns for collections:
  - `/menus`
  - `/orders`
  - `/categories`
- Use singular resource IDs in nested paths:
  - `/menus/:menuId/categories`
- Avoid action verbs in route names where a resource model already exists

Prefer:

```txt
POST /baskets/:basketId/items
```

Instead of:

```txt
POST /add-item-to-basket
```

## Localization

The kiosk supports language switching, so read endpoints should accept locale context.

Recommended approach for public read endpoints:

- query parameter: `?locale=pl`

Example:

```txt
GET /api/v1/kiosk/menus/active?locale=pl
```

Reason:

- simple to debug
- explicit in requests
- easy for frontend state to control

The backend should:

- fall back to the restaurant default locale if a translation is missing
- never return an empty translation payload if a default exists

## Filtering, Search, and Pagination

Use query parameters for read filters.

Examples:

- `GET /api/v1/kiosk/menus/:menuId/categories?locale=pl`
- `GET /api/v1/admin/orders?status=new&page=1&pageSize=20`

Recommended rules:

- pagination is required for admin list endpoints
- search/filter query params should be optional and additive
- public kiosk menu browsing should avoid unnecessary pagination unless menu size demands it

## Availability and Visibility Rules

The frontend should not decide product availability.

The backend should evaluate:

- active menu
- menu visibility
- category visibility
- product visibility
- recurring schedule rules
- one-off availability exceptions

If a product is unavailable, it should not appear in public kiosk responses unless a future admin/debug endpoint explicitly requests hidden data.

## Response Design

Use explicit DTOs that match the frontend use case, not raw Prisma models.

Example response shape for a menu product card:

```json
{
  "id": "menu-product-uuid",
  "productId": "product-uuid",
  "type": "ITEM",
  "name": "Classic Burger",
  "description": "Single beef burger with salad and sauce.",
  "price": "18.90",
  "currencyCode": "PLN",
  "imageUrl": "/seed/classic-burger.jpg",
  "isAvailable": true
}
```

This keeps API contracts stable even if the database model grows.

## Write Endpoint Rules

### Basket Writes

Basket endpoints should:

- validate menu product availability on every write
- validate modifier selections on the backend
- calculate pricing on the backend
- store configuration snapshots for checkout continuity

### Payment Writes

Payment-related endpoints should:

- never trust client-calculated totals
- create checkout state based on backend-validated basket data
- treat frontend success redirects as informational only
- confirm final payment through webhook verification

### Admin Writes

Admin write endpoints should:

- validate role access
- reject invalid status transitions
- log important state changes later when audit logging is added

## Error Handling

Use predictable HTTP status codes:

- `400` for invalid request shape or invalid selections
- `401` for unauthenticated admin access
- `403` for authenticated but unauthorized access
- `404` for missing or hidden resources
- `409` for business-state conflicts
- `422` for semantically invalid order or payment input when needed

Customer-facing error messages should stay simple and non-technical.

## Recommended First Endpoint Order

Implement the first API endpoints in this order:

1. `GET /api/v1/kiosk/menus/active`
2. `GET /api/v1/kiosk/menus/:menuId/categories`
3. `GET /api/v1/kiosk/menu-products/:menuProductId`
4. `POST /api/v1/kiosk/baskets`
5. `POST /api/v1/kiosk/baskets/:basketId/items`

Reason:

- this order matches the primary kiosk journey
- it lets the frontend browse real catalog data before checkout logic starts
- it keeps payment and admin work off the critical path for the first functional slice
