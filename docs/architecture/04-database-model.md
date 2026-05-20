# Database Model

## Purpose
This document translates the current domain model into a relational database design for PostgreSQL and Prisma.

## Summary
The database model is designed around one restaurant with multiple menus, reusable categories, reusable products, menu-specific pricing, recurring availability rules, one-off availability exceptions, configurable meals, ingredient personalization, basket and order snapshots, and protected admin access.

## Database Conventions
- Use PostgreSQL as the primary database engine.
- Use `uuid` primary keys for application-owned tables.
- Use `snake_case` for table and column names.
- Use `timestamptz` for absolute timestamps such as creation times, payment events, and one-off availability exceptions.
- Use integer minute offsets from midnight for recurring local time windows in the Prisma implementation.
- Use `numeric(10,2)` for money values.
- Use `jsonb` for basket and order configuration snapshots.
- Use the restaurant timezone as the default timezone for recurring availability evaluation.

## Core Tables

### Restaurant And Menu Structure

#### `restaurants`
Purpose:
- Root business entity for the MVP

Key columns:
- `id uuid pk`
- `name text`
- `slug text`
- `timezone text`
- `default_locale text`
- `currency_code text`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `menus`
Purpose:
- Store restaurant menus such as breakfast, lunch, or seasonal menus

Key columns:
- `id uuid pk`
- `restaurant_id uuid fk -> restaurants.id`
- `code text`
- `name text`
- `description text null`
- `sort_order integer`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `menu_translations`
Purpose:
- Localized menu copy

Key columns:
- `id uuid pk`
- `menu_id uuid fk -> menus.id`
- `locale text`
- `name text`
- `description text null`

#### `categories`
Purpose:
- Reusable category definitions shared across menus

Key columns:
- `id uuid pk`
- `restaurant_id uuid fk -> restaurants.id`
- `code text`
- `name text`
- `description text null`
- `sort_order integer`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `category_translations`
Purpose:
- Localized category copy

Key columns:
- `id uuid pk`
- `category_id uuid fk -> categories.id`
- `locale text`
- `name text`
- `description text null`

#### `products`
Purpose:
- Reusable catalog products used standalone or inside meals

Key columns:
- `id uuid pk`
- `restaurant_id uuid fk -> restaurants.id`
- `type product_type`
- `sku text`
- `name text`
- `description text null`
- `base_price numeric(10,2)`
- `image_url text null`
- `is_available boolean`
- `is_standalone_orderable boolean`
- `can_be_meal_option boolean`
- `sort_order integer`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `product_translations`
Purpose:
- Localized product copy

Key columns:
- `id uuid pk`
- `product_id uuid fk -> products.id`
- `locale text`
- `name text`
- `description text null`

#### `menu_categories`
Purpose:
- Assign reusable categories to a specific menu

Key columns:
- `id uuid pk`
- `menu_id uuid fk -> menus.id`
- `category_id uuid fk -> categories.id`
- `sort_order integer`
- `is_visible boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `menu_products`
Purpose:
- Assign reusable products to a specific menu category
- Store menu-specific price and visibility

Key columns:
- `id uuid pk`
- `menu_category_id uuid fk -> menu_categories.id`
- `product_id uuid fk -> products.id`
- `menu_price numeric(10,2) null`
- `sort_order integer`
- `is_visible boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

### Availability And Scheduling

#### `menu_availability_rules`
Purpose:
- Recurring availability for menus

Key columns:
- `id uuid pk`
- `menu_id uuid fk -> menus.id`
- `start_date date null`
- `end_date date null`
- `days_of_week smallint[]`
- `start_minute_of_day integer`
- `end_minute_of_day integer`
- `is_active boolean`

#### `menu_availability_exceptions`
Purpose:
- One-off menu overrides such as holidays or temporary closures

Key columns:
- `id uuid pk`
- `menu_id uuid fk -> menus.id`
- `start_at timestamptz`
- `end_at timestamptz`
- `override_type availability_override_type`
- `is_closed boolean`
- `reason text null`
- `is_active boolean`

#### `menu_category_availability_rules`
Purpose:
- Recurring availability for a category inside a menu

Key columns:
- `id uuid pk`
- `menu_category_id uuid fk -> menu_categories.id`
- `start_date date null`
- `end_date date null`
- `days_of_week smallint[]`
- `start_minute_of_day integer`
- `end_minute_of_day integer`
- `is_active boolean`

#### `menu_category_availability_exceptions`
Purpose:
- One-off category overrides inside a menu

Key columns:
- `id uuid pk`
- `menu_category_id uuid fk -> menu_categories.id`
- `start_at timestamptz`
- `end_at timestamptz`
- `override_type availability_override_type`
- `is_closed boolean`
- `reason text null`
- `is_active boolean`

#### `menu_product_availability_rules`
Purpose:
- Recurring availability for a product inside a menu category

Key columns:
- `id uuid pk`
- `menu_product_id uuid fk -> menu_products.id`
- `start_date date null`
- `end_date date null`
- `days_of_week smallint[]`
- `start_minute_of_day integer`
- `end_minute_of_day integer`
- `is_active boolean`

#### `menu_product_availability_exceptions`
Purpose:
- One-off product overrides inside a menu category

Key columns:
- `id uuid pk`
- `menu_product_id uuid fk -> menu_products.id`
- `start_at timestamptz`
- `end_at timestamptz`
- `override_type availability_override_type`
- `is_closed boolean`
- `reason text null`
- `is_active boolean`

### Configurable Meals

#### `product_group_templates`
Purpose:
- Reusable meal group templates such as sandwich, side, or drink

Key columns:
- `id uuid pk`
- `code text`
- `name text`
- `default_min_selections integer`
- `default_max_selections integer`
- `default_selection_mode selection_mode`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `product_group_template_translations`
Purpose:
- Localized product group template copy

Key columns:
- `id uuid pk`
- `product_group_template_id uuid fk -> product_group_templates.id`
- `locale text`
- `name text`

#### `product_groups`
Purpose:
- Attach a reusable group template to a specific meal or large meal

Key columns:
- `id uuid pk`
- `product_id uuid fk -> products.id`
- `product_group_template_id uuid fk -> product_group_templates.id`
- `name_override text null`
- `min_selections integer`
- `max_selections integer`
- `selection_mode selection_mode`
- `sort_order integer`
- `is_required boolean`

#### `product_group_options`
Purpose:
- Selectable product options inside a meal group

Key columns:
- `id uuid pk`
- `product_group_id uuid fk -> product_groups.id`
- `product_id uuid fk -> products.id`
- `price_adjustment numeric(10,2)`
- `sort_order integer`
- `is_default boolean`
- `is_available boolean`

### Ingredients And Personalization

#### `ingredients`
Purpose:
- Reusable ingredient definitions

Key columns:
- `id uuid pk`
- `code text`
- `name text`
- `description text null`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `ingredient_translations`
Purpose:
- Localized ingredient copy

Key columns:
- `id uuid pk`
- `ingredient_id uuid fk -> ingredients.id`
- `locale text`
- `name text`
- `description text null`

#### `product_ingredients`
Purpose:
- Product-specific ingredient behavior and pricing

Key columns:
- `id uuid pk`
- `product_id uuid fk -> products.id`
- `ingredient_id uuid fk -> ingredients.id`
- `default_quantity integer`
- `is_default_included boolean`
- `is_removable boolean`
- `remove_price_adjustment numeric(10,2)`
- `allow_extra boolean`
- `extra_unit_price numeric(10,2)`
- `max_extra_quantity integer`
- `sort_order integer`
- `is_available boolean`

#### `modifier_groups`
Purpose:
- Personalization groups such as remove ingredients or add extras

Key columns:
- `id uuid pk`
- `product_id uuid fk -> products.id`
- `name text`
- `action_type modifier_action_type`
- `selection_type selection_mode`
- `min_selections integer`
- `max_selections integer`
- `allow_quantity boolean`
- `sort_order integer`
- `is_required boolean`

#### `modifier_options`
Purpose:
- Selectable modifier options inside a modifier group

Key columns:
- `id uuid pk`
- `modifier_group_id uuid fk -> modifier_groups.id`
- `ingredient_id uuid fk -> ingredients.id null`
- `product_ingredient_id uuid fk -> product_ingredients.id null`
- `price_adjustment numeric(10,2)`
- `max_quantity integer`
- `sort_order integer`
- `is_available boolean`

### Basket, Order, And Payment

#### `baskets`
Purpose:
- Hold the active kiosk selection before checkout

Key columns:
- `id uuid pk`
- `session_id uuid`
- `status basket_status`
- `subtotal_amount numeric(10,2)`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `basket_items`
Purpose:
- Store configured line items before checkout

Key columns:
- `id uuid pk`
- `basket_id uuid fk -> baskets.id`
- `menu_product_id uuid fk -> menu_products.id`
- `product_id uuid fk -> products.id`
- `product_name_snapshot text`
- `quantity integer`
- `unit_price numeric(10,2)`
- `line_total numeric(10,2)`
- `configuration_snapshot jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `orders`
Purpose:
- Persist submitted customer purchase attempts

Key columns:
- `id uuid pk`
- `restaurant_id uuid fk -> restaurants.id`
- `order_number text`
- `status order_status`
- `payment_status payment_status`
- `subtotal_amount numeric(10,2)`
- `total_amount numeric(10,2)`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `order_items`
Purpose:
- Persist purchased line items as snapshots

Key columns:
- `id uuid pk`
- `order_id uuid fk -> orders.id`
- `menu_product_id uuid fk -> menu_products.id null`
- `product_id uuid fk -> products.id`
- `product_name text`
- `product_type product_type`
- `unit_price numeric(10,2)`
- `quantity integer`
- `line_total numeric(10,2)`
- `configuration_snapshot jsonb`

#### `payments`
Purpose:
- Persist Stripe payment lifecycle state

Key columns:
- `id uuid pk`
- `order_id uuid fk -> orders.id`
- `provider payment_provider`
- `provider_session_id text`
- `provider_payment_intent_id text null`
- `status payment_status`
- `amount numeric(10,2)`
- `currency text`
- `created_at timestamptz`
- `updated_at timestamptz`

### Admin Authentication

#### `admin_users`
Purpose:
- Store administrator credentials and state

Key columns:
- `id uuid pk`
- `email text`
- `password_hash text`
- `role admin_role`
- `is_active boolean`
- `last_login_at timestamptz null`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `admin_sessions`
Purpose:
- Store revocable admin sessions

Key columns:
- `id uuid pk`
- `admin_user_id uuid fk -> admin_users.id`
- `token_id uuid`
- `expires_at timestamptz`
- `created_at timestamptz`
- `revoked_at timestamptz null`

## Suggested Enums

### `product_type`
- `item`
- `meal`
- `large_meal`

### `selection_mode`
- `single`
- `multiple`

### `modifier_action_type`
- `remove`
- `add`

### `basket_status`
- `active`
- `checked_out`
- `abandoned`
- `expired`

### `order_status`
- `new`
- `in_progress`
- `ready`
- `completed`
- `cancelled`

### `payment_status`
- `pending`
- `awaiting_payment_confirmation`
- `paid`
- `failed`
- `cancelled`

### `payment_provider`
- `stripe`

### `admin_role`
- `admin`

### `availability_override_type`
- `closure`
- `special_opening`
- `manual_override`

## Key Constraints

### Uniqueness
- `restaurants.slug` unique
- `menus(restaurant_id, code)` unique
- `categories(restaurant_id, code)` unique
- `products(restaurant_id, sku)` unique
- `menu_translations(menu_id, locale)` unique
- `category_translations(category_id, locale)` unique
- `product_translations(product_id, locale)` unique
- `ingredient_translations(ingredient_id, locale)` unique
- `product_group_template_translations(product_group_template_id, locale)` unique
- `menu_categories(menu_id, category_id)` unique
- `menu_products(menu_category_id, product_id)` unique
- `product_ingredients(product_id, ingredient_id)` unique
- `orders.order_number` unique
- `payments.order_id` unique if one payment record per order is enforced
- `payments.provider_session_id` unique
- `admin_users.email` unique
- `admin_sessions.token_id` unique

### Recommended Check Constraints
- `min_selections >= 0`
- `max_selections >= min_selections`
- `quantity > 0` on basket and order items
- `line_total >= 0` on basket and order items
- `start_at < end_at` on availability exceptions
- `menu_price >= 0` when present
- `default_quantity >= 0`
- exactly one of `modifier_options.ingredient_id` or `modifier_options.product_ingredient_id` should be set

## Suggested Indexes
- indexes on all foreign keys
- `menus(restaurant_id, is_active, sort_order)`
- `menu_categories(menu_id, is_visible, sort_order)`
- `menu_products(menu_category_id, is_visible, sort_order)`
- `products(restaurant_id, type, is_available)`
- GIN index on `basket_items.configuration_snapshot`
- GIN index on `order_items.configuration_snapshot`
- indexes on availability rule and exception foreign keys plus active flags
- `orders(created_at)`
- `orders(status, payment_status)`
- `admin_sessions(admin_user_id, expires_at, revoked_at)`

## Snapshot Strategy

### Why Snapshots Are Required
Menu pricing, product text, meal configuration, and ingredient availability can all change after an order is placed. Basket and order lines must preserve what the customer actually selected at that time.

### `basket_items.configuration_snapshot`
Recommended contents:
- selected meal groups
- selected meal options
- selected ingredient removals
- selected extra ingredients
- selected extra quantities
- per-choice price adjustments

### `order_items.configuration_snapshot`
Recommended contents:
- all finalized basket configuration data
- menu context used for pricing
- localized labels if needed for operational display
- any resolved option and modifier pricing at purchase time

## Pricing Strategy
- `products.base_price` stores the catalog-level default or fallback price.
- `menu_products.menu_price` stores the menu-specific price actually offered in a given menu.
- `product_group_options.price_adjustment` stores upgrades or discounts inside meal selections.
- `product_ingredients.remove_price_adjustment` stores the price impact of removing an ingredient.
- `product_ingredients.extra_unit_price` stores the incremental price for extra ingredient quantity.
- `basket_items.unit_price` and `order_items.unit_price` must store the resolved final per-unit price after menu pricing and configuration adjustments.

## Availability Resolution Strategy
- Resolve the active restaurant timezone first.
- Evaluate recurring menu rules.
- Apply menu exceptions over recurring menu rules.
- Evaluate menu-category rules and exceptions.
- Evaluate menu-product rules and exceptions.
- Apply direct visibility flags such as `is_visible` and `is_available`.
- Treat one-off exceptions as higher priority than recurring rules.

## Prisma Notes
- Prefer Prisma `Decimal` for all monetary columns.
- Prefer Prisma `Json` for configuration snapshots.
- PostgreSQL arrays for `days_of_week` are acceptable for the MVP and map well to Prisma scalar lists.
- Use Prisma enums for all stable status and type values.
- Keep schema relations explicit for `menu_categories` and `menu_products` rather than hiding them inside implicit many-to-many relations.

## Status
Planned. This document defines the intended relational database structure and should guide the upcoming Prisma schema design.
