# Kiosk UI Current Design Snapshot

## Purpose
This document summarizes the current customer-facing kiosk UI design implemented in the frontend.

It describes the design state as it exists now in `apps/web`. It should be updated when the UI changes, and it should not describe planned checkout, payment, or backend behavior as implemented.

## Current Scope
Implemented in the current frontend design:

- Welcome screen
- Menu browsing screen
- Dine in / Take out selection
- Mock menu categories and mock product data
- Featured `For You` menu area
- Product cards
- Cart summary footer
- Accessibility and language utility buttons
- Basic add-to-cart visual feedback

Not implemented yet:

- Full cart drawer or order review screen
- Checkout flow
- Payment flow
- Backend-connected product catalog in the frontend
- Advanced accessibility settings panel
- Real language switching

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
- Popular
- Meals
- Sandwiches
- Bakery
- Coffee
- Drinks
- Desserts
- Sides

Design behavior:

- `For You` is not a database category.
- It works as a special landing category for recommendations, highlights, and quick browsing.
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

- The large banner uses a `For You` pill.
- Smaller highlight banners use the same pill styling for consistency.
- Banners use food images with dark overlays to preserve text readability.

Current quick filters:

- Displayed in one horizontal scrollable row.
- Spacing is intentionally tight so more options fit on kiosk screens.
- Current filter labels include `Plant Based`, `Gluten Free`, `Popular`, `New`, and `No sugar`.

## Product Cards
Product cards are designed for quick scanning and touch interaction.

Current elements:

- Product image
- Optional product label such as `Popular`, `New`, or `Vegetarian`
- Kcal value
- Portion size in grams
- Product name
- Short description
- Price
- Add button

Design behavior:

- Kcal and portion information appear directly under the image in one row.
- The add button gives light feedback after tapping:
  - subtle scale
  - temporary shadow
  - short pulse
  - temporary check icon
- The animation confirms the action without making the kiosk feel busy.

## Cart Footer
The cart footer is fixed at the bottom of the menu screen.

Current layout:

- Accessibility button stays on the left.
- Order summary and checkout stay grouped on the right.
- Spacing between the order summary and checkout button is compact.

Current order summary behavior:

- Empty cart state says `Start your order`.
- When products are added, the footer shows item count.
- The footer previews the latest ordered items as compact chips.
- The checkout button shows the current total.
- Checkout is visually disabled when the cart is empty.

Important limitation:

- The checkout button is only a visual placeholder for now. Real checkout and payment are not implemented yet.

## Accessibility Notes
Current accessibility-oriented decisions:

- Large touch targets
- High-contrast foreground/background colors
- Visible focus rings
- Search input has an accessible label
- Icon buttons use accessible labels
- Active order mode uses more than color through selected/toggle state
- Accessibility button remains visible in the footer

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
- `apps/web/src/features/cart/components/OrderFooter.tsx`
- `apps/web/src/features/menu/api/menuApi.ts`

Keep this structure feature-based and simple. New UI should be added as focused components instead of making one large kiosk component.
