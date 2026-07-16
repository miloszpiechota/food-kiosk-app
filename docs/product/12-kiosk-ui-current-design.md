# Kiosk UI Current Design Snapshot

## Purpose
This document summarizes the current customer-facing kiosk UI design implemented in the frontend.

It describes the design state as it exists now in `apps/web`. It should be updated when the UI changes, and it should not describe planned checkout, payment, or order-creation behavior as implemented.

## Current Scope
Implemented in the current frontend design:

- Welcome screen
- Menu browsing screen
- Dine in / Take out selection
- Backend-connected active menu, categories, and product cards
- Featured `For You` menu area
- Product cards
- Product details page with backend-loaded meal options and modifiers
- Regular / large meal switching
- Required meal option selection controls
- Add-extra and remove-ingredient modifier controls
- Backend basket creation and configured item submission
- Basket Review page with configuration summaries
- Backend basket item quantity updates and removal from Basket Review
- Backend order snapshot creation before payment
- Stripe Checkout session creation from Basket Review
- Stripe redirect handling through Payment Result page
- Backend-backed payment status polling after Stripe redirects back to the kiosk
- Cart summary footer
- Accessibility and language utility buttons
- Loading and error states for menu, product details, basket writes, checkout, and payment result

Not implemented yet:

- Backend-backed basket item editing
- Detailed configuration display in the cart footer
- Advanced accessibility settings panel
- Real language switching
- Admin UI and protected admin workflows

## Visual Direction
The UI uses a neutral restaurant kiosk style that can work for fast food, cafes, bakeries, desserts, drinks, or casual restaurants.

Current visual style:

- Dark premium base
- High-contrast text
- Electric blue primary accents
- Warm amber secondary accents
- Large touch-friendly controls
- Rounded kiosk-style surfaces
- Food imagery for product recognition
- Visible focus states for keyboard accessibility

The goal is to keep the UI polished enough for a portfolio while still practical for real kiosk customers.

## Welcome Screen
The welcome screen is the first customer touchpoint.

Current elements:

- Brand area with logo placeholder and restaurant name
- Large welcome message
- Clear `Dine in` and `Take out` choices
- Language button
- Accessibility button
- Need help button

Design behavior:

- Choosing `Dine in` or `Take out` moves the user to the menu screen.
- The selected order mode is carried into the menu header.
- Utility buttons stay visible and easy to find.

## Menu Header
The menu header no longer uses a separate `Menu` title.

Current elements:

- Brand area
- Segmented `Dine in / Take out` toggle
- Search input
- Language button

Design behavior:

- The order mode toggle looks like a real switch instead of plain text.
- `Dine in` uses the blue primary active style.
- `Take out` uses the amber secondary active style.
- Search remains large and easy to tap.
- The accessibility button was removed from the header to avoid duplication with the footer utility area.

## Category Navigation
The category navigation includes the normal menu categories plus a frontend-owned `For You` category.

Current categories:

- For You
- Meals
- Burgers
- Sides
- Drinks

Design behavior:

- `For You` is not a database category.
- It works as a special landing category for recommendations, highlights, and quick browsing.
- Normal categories are loaded from the backend active menu.
- Category navigation is scrollable so it can support more categories later.

## For You Menu Area
The `For You` area is designed as the default discovery page for the menu.

Current sections:

- Large hero banner
- Two smaller highlight banners
- `Explore quickly` horizontal filter row
- `New this week` product section
- `Best recommendations for you` product section

Current banner styling:

- Banners use food images with dark overlays to preserve text readability.
- Banners keep the text treatment simple and avoid extra status pills.

Current quick filters:

- Displayed in one horizontal scrollable row.
- Spacing is intentionally tight so more options fit on kiosk screens.
- Current filter labels include `Plant Based`, `Gluten Free`, `Popular`, `New`, and `No sugar`.

## Product Cards
Product cards are designed for quick scanning and touch interaction.

Current elements:

- Product image
- Optional kcal value
- Optional portion size in grams
- Product name
- Short description
- Price

Design behavior:

- The whole card is the touch target.
- Cards do not show a separate `Add to cart` or `Customize` button.
- If the product has meal groups, modifiers, or ingredient customization data, tapping the card opens Product Details.
- If the product has no customization surface, tapping the card adds it directly to the backend basket.
- Basket write failures appear as an alert banner above the product grid.

## Product Details Page
The product details page gives the customer a focused view before adding an item to the order.

Current elements:

- Large product image
- Styled `Back to menu` button beside the product title area
- Loading message and skeleton while details load
- Product name
- Full product description
- Regular and large meal selection cards when a linked meal size exists
- Required meal option rows such as burger, side, and drink choices
- Meal option cards with photo, name, and included / surcharge price text
- Add-extra controls with green selected styling
- Remove-ingredient controls with red selected styling
- Quantity stepper
- `Add to order` button with the current estimated total
- Cart footer remains visible

Design behavior:

- Product cards open this page when the product has customization choices.
- The page loads full product detail from the backend menu-product detail endpoint.
- The first available option in each required group is selected initially.
- Regular and large meal cards switch between linked meal products and reload their own options and pricing.
- The displayed total updates when meal choices, modifiers, or quantity change.
- The frontend submits IDs and quantities only; the backend recalculates the authoritative configured price.
- The quantity stepper supports a minimum of 1 and a maximum of 9.
- Adding to order submits the configured item to the backend basket and returns the customer to the menu after success.

## Cart Footer
The cart footer is fixed at the bottom of the menu screen.

Current layout:

- Accessibility button stays on the left.
- Order summary and checkout stay grouped on the right.
- Spacing between the order summary and checkout button is compact.

Current order summary behavior:

- Empty cart state says `Start your order`.
- When products are added, the footer shows the backend basket item count.
- The footer previews the latest backend basket items as compact chips.
- The checkout button shows the backend subtotal.
- Checkout is visually disabled when the cart is empty.

Important limitation:

- The checkout button opens Basket Review when the cart has items.
- The footer does not yet expose full configuration details or item editing.

## Basket Review Page

The Basket Review page is opened from the footer checkout button after at least one item has been added.

Current elements:

- `Back to menu` action
- order mode selector for `Dine in` and `Take out`
- list of backend basket items
- line total and unit price per item
- customer-readable meal choices from `configurationSnapshot`
- green styling for add-extra modifiers
- red styling for removed-ingredient modifiers
- backend-backed quantity stepper
- backend-backed remove action
- price breakdown using the backend subtotal
- empty basket state
- checkout/order snapshot panel

Current behavior:

- The page renders the current frontend basket state returned by the backend.
- It does not invent tax, discounts, or payment totals.
- Quantity changes and item removal call backend basket endpoints and refresh the returned basket state.
- Creating an order snapshot calls the backend order endpoint and marks the active basket as checked out.
- Continuing to payment creates a Stripe Checkout Session from the backend-created order snapshot.
- The browser is redirected to Stripe Checkout using the backend-returned checkout URL.
- Editing an existing configured item still shows a planned-state message until Product Details edit mode is implemented.

## Payment Result Page

The Payment Result page is opened when Stripe redirects back to the kiosk after checkout.

Current elements:

- order number when available
- payment status message
- success, cancelled, failed, and waiting states
- retry/status polling behavior while webhook confirmation is still pending
- action to start a new order

Current behavior:

- Stripe redirect query parameters are treated as informational only.
- The page calls the backend order endpoint to read the latest stored payment status.
- The page polls briefly so a verified webhook that arrives just after the redirect can still update the UI.
- Payment is considered confirmed only when the backend reports a webhook-confirmed paid state.
- After completion, the kiosk can return to the welcome screen for the next customer.

## Accessibility Notes
Current accessibility-oriented decisions:

- Large touch targets
- High-contrast foreground/background colors
- Visible focus rings
- Search input has an accessible label
- Icon buttons use accessible labels
- Active order mode uses more than color through selected/toggle state
- Accessibility button remains visible in the footer
- Product details loading uses a visible status message
- Product option cards and modifier chips preserve button semantics and visible focus states

Planned accessibility work:

- Automated accessibility testing
- More complete keyboard flow testing
- Real accessibility panel or settings if the product scope requires it

## Implementation Notes
Primary frontend files for this design:

- `apps/web/src/pages/WelcomePage/WelcomePage.tsx`
- `apps/web/src/pages/MenuPage/MenuPage.tsx`
- `apps/web/src/shared/layout/Header.tsx`
- `apps/web/src/shared/layout/BottomActionBar.tsx`
- `apps/web/src/features/menu/components/CategoryTabs.tsx`
- `apps/web/src/features/menu/components/ProductGrid.tsx`
- `apps/web/src/features/menu/components/ProductCard.tsx`
- `apps/web/src/pages/ProductDetailsPage/ProductDetailsPage.tsx`
- `apps/web/src/pages/BasketReviewPage/BasketReviewPage.tsx`
- `apps/web/src/pages/PaymentResultPage/PaymentResultPage.tsx`
- `apps/web/src/features/cart/api/basketApi.ts`
- `apps/web/src/features/cart/components/OrderFooter.tsx`
- `apps/web/src/features/menu/api/menuApi.ts`

Keep this structure feature-based and simple. New UI should be added as focused components instead of making one large kiosk component.
