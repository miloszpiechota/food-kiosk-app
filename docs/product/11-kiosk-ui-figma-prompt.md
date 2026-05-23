# Kiosk UI Figma Prompt

## Purpose
This document defines the first Figma design prompt for the customer-facing kiosk UI.

The first design should cover only:
- Welcome screen
- Menu browsing/search screen

The design should be neutral enough for fast food, cafes, bakeries, dessert shops, and casual restaurants, while using the portfolio hallmark visual style: glossy black surfaces with electric blue and warm amber/orange highlights.

## Design Direction

### Target Device
Primary target:
- Portrait kiosk: `1080 x 1920 px`

Adaptive variants:
- Landscape kiosk/tablet: `1920 x 1080 px`
- Tablet portrait: `834 x 1194 px`
- Mobile fallback: `390 x 844 px`

### Visual Style
- Neutral restaurant kiosk interface.
- Dark premium base inspired by glossy futuristic black material.
- Electric blue and amber/orange accent lighting.
- High-contrast text and controls.
- Simple, readable, and practical.
- Universal restaurant content, not tied to one food category.
- Food images should work for burgers, coffee, bakery, drinks, desserts, meals, and sides.

### Accessibility Direction
The first version does not need an expanded accessibility settings panel.

Required accessibility elements:
- Visible accessibility icon/button on every screen.
- Visible language icon/button on every screen.
- High contrast between text and background.
- Large touch targets.
- Readable typography.
- Clear active, focused, selected, and disabled states.
- Do not rely on color alone to communicate state.

## Screen 1: Welcome

Required elements:
- Full-screen kiosk welcome screen.
- Large welcome banner.
- Primary text: `Welcome`
- Supporting text: `Choose how you would like to order`
- Two large order mode buttons:
  - `Dine in`
  - `Take out`
- Selecting either option navigates to the menu browsing screen.
- Language icon/button visible.
- Accessibility icon/button visible.
- Minimal distractions.
- Strong visual hierarchy.

## Screen 2: Menu Browsing And Search

Required elements:
- Left sidebar with product categories.
- Search input or search button near the top.
- Product grid in the main area.
- Cart/order summary area.
- Language icon/button visible.
- Accessibility icon/button visible.

Suggested categories:
- Popular
- Meals
- Sandwiches
- Bakery
- Coffee
- Drinks
- Desserts
- Sides

Product cards should include:
- Product image
- Product name
- Short description
- Price
- Add button
- Optional label such as `Popular`, `New`, or `Vegetarian`

Cart summary should include:
- Item count
- Subtotal
- View order button
- Checkout button
- Clear empty-cart state

## Layout Recommendation
For `1080 x 1920` portrait kiosk:
- Use a left category sidebar.
- Use a large central product grid.
- Use a bottom cart bar rather than a permanent right cart panel.

Reason:
- Portrait kiosks are tall and narrow.
- A right cart panel would reduce product card width too much.
- A bottom cart bar keeps checkout visible while preserving browsing space.

For `1920 x 1080` landscape:
- Use a left category sidebar.
- Use a wider central product grid.
- Use a right cart panel.

## Figma Prompt

```text
Design a high-fidelity responsive restaurant self-ordering kiosk app UI.

The app must be universal for many restaurant types: fast food, cafe, bakery, dessert shop, casual restaurant, and drink shop. Do not make it specific to one brand or cuisine.

Use this visual direction:
- Premium dark glossy interface inspired by futuristic black reflective material
- Electric blue accent lighting
- Warm amber/orange accent lighting
- Clean neutral restaurant UI
- Strong contrast and excellent readability
- Simple, intuitive, practical kiosk software
- Avoid clutter, decorative cards inside cards, and overly complex effects
- The style should feel like a polished portfolio hallmark while still being usable by real restaurant customers

Primary frame:
- Portrait kiosk screen: 1080 x 1920 px

Also create adaptive responsive variants:
- Landscape kiosk/tablet: 1920 x 1080 px
- Tablet portrait: 834 x 1194 px
- Mobile fallback: 390 x 844 px

Accessibility requirements:
- Follow WCAG 2.2 AA contrast
- Use large readable typography
- Use large touch-friendly controls
- Show visible focus states
- Use clear active, selected, disabled, and empty states
- Do not rely on color alone
- Add a visible accessibility icon/button on every screen
- Add a visible language icon/button on every screen
- Keep the accessibility button simple; no advanced settings panel is required in this first version

Create only two main screens.

Screen 1: Welcome screen
- Full-screen portrait kiosk welcome screen
- Large central welcome banner
- Main text: “Welcome”
- Supporting text: “Choose how you would like to order”
- Two large primary order mode buttons:
  - “Dine in”
  - “Take out”
- Tapping either “Dine in” or “Take out” navigates to the ordering screen
- Include a language icon/button
- Include an accessibility icon/button
- The design should be minimal, premium, high contrast, and easy to understand from a distance
- Use glossy black surfaces with blue and amber/orange highlights, but keep text areas readable

Screen 2: Menu browsing and search screen
- Main ordering screen for browsing all products in the menu
- Left sidebar with large vertical category buttons
- Categories:
  - Popular
  - Meals
  - Sandwiches
  - Bakery
  - Coffee
  - Drinks
  - Desserts
  - Sides
- Active category state must be clear
- Top area includes:
  - Restaurant logo placeholder
  - Current page title: “Menu”
  - Search input or large search button
  - Language icon/button
- Main content area shows a responsive product grid
- Product cards include:
  - Food image
  - Product name
  - Short description
  - Price
  - Add button
  - Optional label such as “Popular”, “New”, or “Vegetarian”
- Use universal food placeholder images suitable for cafes, bakeries, drinks, meals, and casual food
- Bottom cart summary bar for the 1080 x 1920 portrait kiosk layout
- Cart summary bar includes:
  - Item count
  - Subtotal
  - “View order” button
  - “Checkout” button
  - Empty cart state when no items are added
- Accessibility icon/button remains visible near the bottom of the screen
- Search should be visually obvious and easy to tap

Adaptive layout behavior:
- On 1080 x 1920 portrait kiosk:
  - Left category sidebar
  - Central product grid
  - Bottom cart summary bar
- On 1920 x 1080 landscape:
  - Left category sidebar
  - Wider product grid
  - Right cart summary panel
- On tablet:
  - Keep category navigation visible but more compact
  - Keep cart summary accessible
- On mobile:
  - Categories may become horizontal tabs or a drawer
  - Cart summary should be fixed near the bottom

Component requirements:
- Use auto layout and responsive constraints
- Create reusable components:
  - Primary button
  - Secondary button
  - Category navigation item
  - Product card
  - Search field/button
  - Bottom cart bar
  - Language button
  - Accessibility button
- Include component variants:
  - Default
  - Hover
  - Focused
  - Active/selected
  - Disabled
  - Empty cart

Prototype interactions:
- “Dine in” navigates to the menu screen
- “Take out” navigates to the menu screen
- Category tap changes active category
- Product “Add” updates cart visual state
- Search field/button shows active search state
- “View order” opens a cart summary overlay placeholder
- “Checkout” appears disabled when cart is empty

Tone:
- Universal restaurant kiosk
- Premium but simple
- Accessible
- Modern
- High contrast
- Portfolio-ready
```

## Open Design Questions
Answer these before expanding the design beyond the first two screens:

1. Should `Dine in` and `Take out` affect checkout fees, packaging text, or order labels later?
2. Should the first real brand placeholder be generic, or should it use a project name such as `Food Kiosk`?
3. Should the product grid prioritize large product images or show more products per screen?
4. Should search open a full-screen search mode or stay as an inline input?
5. Should the accessibility icon sit bottom left, bottom right, or inside the bottom utility bar?
