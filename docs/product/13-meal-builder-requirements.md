# Meal Builder Requirements

## Status

Draft for product decisions.

This document defines the intended customer behavior for meals and large meals. It does not imply that the complete meal-builder flow is implemented.

## Purpose

Allow the kiosk catalog to contain:

- standalone items
- meals
- large meals

A meal is a purchasable product composed of selections from two to four required groups. A typical meal may contain:

1. one main item
2. one side
3. one drink

These group names are examples, not a fixed structure. A meal does not need a group called `Main item`.

For example, a nuggets meal may contain:

1. one nuggets group with several nugget-count options
2. one side group

The meal itself has a catalog identity, image, description, base price, availability, and menu placement. The selected products inside its groups form the meal configuration.

## Product Types

### Standalone Item

A product with type `ITEM`.

Examples:

- Classic Burger
- Fries
- Cola

An item may be:

- directly orderable
- available as an option inside a meal group
- both directly orderable and available inside meals

### Meal

A product with type `MEAL`.

Recommended MVP structure:

- at least two groups
- at most four groups
- every group is required
- every group allows exactly one selected option
- the first available option in display order is automatically selected

Example:

```text
Burger Meal
+-- Main item: Classic Burger or Cheese Burger
+-- Side: Fries or Side Salad
`-- Drink: Cola or Orange Juice
```

### Large Meal

A product with type `LARGE_MEAL`.

A large meal uses the same group system as a meal, but may have:

- a different base price
- different allowed options
- large side options
- large drink options
- different price adjustments
- other large-size products as group options

A large meal is stored as a separate `LARGE_MEAL` product in the database. It is connected to its related regular `MEAL` product.

The regular meal is the customer-facing product listed in the Meals category for the initial implementation. The linked large meal is selected through the regular meal configuration flow rather than displayed as a separate meal card.

## Meal Groups

A group defines one customer decision inside a meal.

Possible reusable group templates:

- Main item
- Nuggets
- Side
- Drink

Each meal receives its own group assignments. This allows two meals to reuse the same logical group while configuring different:

- names
- selection limits
- available options
- defaults
- ordering
- required status

### Group Rules

Each group must define:

- `minSelections`
- `maxSelections`
- `selectionMode`
- `isRequired`
- `sortOrder`

Recommended MVP rules:

- every meal has between two and four groups
- every existing group is required
- every group requires exactly one selection
- `selectionMode` is `SINGLE`
- `minSelections` is `1`
- `maxSelections` is `1`
- a meal may use any meaningful group combination
- a group named `Main item` is not mandatory

Optional and multi-select groups are outside the initial implementation.

## Group Options

A group option references a reusable product.

Example:

```text
Group: Choose your side
+-- Regular Fries: +0.00
`-- Side Salad: +0.90
```

Each option must define:

- referenced product
- price adjustment
- display order
- availability

An option may be offered in more than one meal or group.

## Automatic Initial Selections

Options are ordered by `sortOrder`.

Initial behavior:

- the first available option in each group is automatically selected
- the customer can replace it with another option
- the initial selection counts toward required-group validation
- unavailable options are skipped
- if no option is available, the meal cannot be added to the basket
- display order therefore has business meaning and must be managed deliberately

## Pricing

The standalone price of an option product does not determine its price inside a meal.

For example:

- standalone fries may cost `10.00`
- regular fries may already be included in the meal price
- changing to premium fries may add only `+4.00`

The meal uses an included-configuration and surcharge model:

```text
configured unit price
  = meal menu price
  + selected non-included option surcharges
  + selected personalization adjustments
```

Example:

```text
Burger Meal menu price                 20.00
Included regular fries                  0.00
Upgrade to premium fries               4.00
Upgrade to orange juice                2.00
Extra pickles                           1.00
                                      -----
Configured unit price                  27.00
```

Rules:

- the meal menu price includes the first option from every group
- the first option normally has a `0.00` surcharge
- later options may have a meal-specific surcharge such as `+2.00` or `+4.00`
- `ProductGroupOption.priceAdjustment` represents this meal-specific surcharge
- the option product's standalone price is ignored when calculating the meal price
- regular and large meals have separate base prices and separate group-option surcharges
- the frontend may display a live estimate
- the backend is authoritative
- the frontend must never submit or control the final price
- every basket write must recalculate the price using current database rules
- quantity is applied after the configured unit price is calculated
- line total equals configured unit price multiplied by quantity

## Product Personalization

Standalone products may support:

- removing included ingredients
- adding supported ingredients
- selecting extra quantities

If an item supports customization when ordered independently, the same customization is available when that item is selected inside a meal group.

Customization belongs to the selected item, not to the meal group itself.

Examples:

- remove pickles from a selected burger
- add cheese to a selected burger
- choose extra sauce for selected nuggets

The configuration contract must identify both:

- the selected group option
- modifiers applied to that selected product

An item without configured ingredients or modifiers does not display customization controls.

## Product Details Page

### Standalone Item

The page should show:

- product information
- price
- quantity
- supported ingredient and modifier controls
- validation feedback
- calculated total

### Meal Or Large Meal

The page should additionally show:

- groups in `sortOrder`
- required status
- selection instructions
- available options
- option price adjustments
- current selection for every group
- validation feedback for incomplete groups
- calculated configured price

Recommended interaction:

1. Load the product detail from the backend.
2. Automatically select the first available option in each group.
3. Let the customer replace the selected option in each group.
4. Let the customer customize selected items when supported.
5. Recalculate the displayed estimated price.
6. Prevent adding if any group has no valid selection.
7. Submit IDs and quantities, not names or prices.
8. Show a clear error if backend validation rejects stale selections.

## Validation Rules

The backend must validate:

- the menu product exists and is currently orderable
- product type supports the submitted configuration
- a meal contains between two and four configured groups
- every submitted group belongs to the selected meal
- every selected option belongs to its submitted group
- selected option products are available
- every group contains exactly one selection
- all groups are complete because every group is required
- modifier selections belong to the configured product
- modifier quantities stay within allowed limits
- no duplicate selection is submitted where duplicates are not allowed
- price is recalculated from current database values

Unknown groups, options, modifiers, and client-supplied prices must be rejected.

## Basket Behavior

Every configured meal is a distinct basket item unless its complete normalized configuration matches an existing item.

The basket must preserve:

- meal product and menu-product identifiers
- product type
- selected group options
- selected option names as display snapshots
- option price adjustments as snapshots
- selected modifiers and quantities
- configured unit price
- quantity
- line total

Two instances of the same meal with different selections must not be merged.

Example:

```text
1x Burger Meal
   Classic Burger
   Fries
   Cola

1x Burger Meal
   Cheese Burger
   Side Salad
   Orange Juice
```

## Catalog Placement And Availability

Initial catalog placement:

- regular meals are listed in the Meals category
- large meals are stored separately in the database
- large meals are linked to their related regular meals
- large meals are not displayed as separate Product Cards
- the Product Details flow may offer the linked large meal as an upgrade or size choice

At read and basket-write time, the system must verify:

- meal product availability
- group availability through its active configuration
- option-level availability
- selected product availability

Meal option products do not need to be displayed as standalone Product Cards to be selectable inside a meal. Their group-option and product availability must still be valid.

## Accessibility

The meal builder must:

- support keyboard and touch interaction
- expose group names and required status
- not communicate selection or errors by color alone
- preserve visible focus indicators
- use large selection targets
- place validation feedback next to the affected group
- move focus to, or clearly identify, the first invalid group after submission
- announce meaningful price and validation changes where appropriate

## Current Implementation Status

### Existing Foundation

- Prisma product types for `ITEM`, `MEAL`, and `LARGE_MEAL`
- reusable product-group templates
- meal-specific product groups
- product-group options
- option price adjustments and defaults
- seed examples for a burger meal and large burger meal
- explicit regular-to-large meal database relationship
- backend product-detail response containing groups and options
- nested item customization data for meal-group options
- basket and order configuration snapshot fields
- backend meal-group and modifier validation
- backend-authoritative meal surcharge pricing
- basket creation and configured basket-item write endpoints
- configuration-aware basket-item merging
- frontend catalog loading from backend menu endpoints
- frontend Product Details loading from the backend detail endpoint
- regular/large meal switching in Product Details
- required group selection controls with first-option initialization
- item-level modifier controls for selected meal options
- frontend basket creation and configured item submission
- backend basket totals reflected in the kiosk footer
- configuration-aware Basket Review display
- backend-backed basket item quantity updates and removal
- checkout/order snapshot creation from the active basket

### Planned

- editing an existing configured basket item through Product Details
- payment flow after order snapshot creation

## Confirmed Product Decisions

1. A meal has between two and four groups.
2. A `Main item` group is not mandatory.
3. Every group is required in the initial implementation.
4. Every group allows exactly one selected option.
5. The first available option by display order is automatically selected.
6. Selected meal items inherit their item-level customization.
7. Regular meals are listed in the Meals category.
8. Large meals are separate database products linked to regular meals.
9. Large meals use different groups, such as large sides and large drinks.
10. The meal base price includes the first option from every group.
11. Alternative options use meal-specific surcharges independent of standalone prices.
12. Identical normalized configurations merge into one basket line by increasing quantity.
13. The customer switches between regular and large meals through meal-size cards in Product Details.
14. A regular meal has at most one linked large meal in the current data model.
15. Products used only as meal options may remain absent from visible menu categories.
16. Selected side and drink items may expose customization whenever those products define modifier groups.

## Remaining Decisions

No open product decisions remain for the current meal-builder MVP.

Next decisions belong to the basket review, checkout, payment, and order-management flows.
