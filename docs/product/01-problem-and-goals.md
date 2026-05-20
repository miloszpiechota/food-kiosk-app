# Problem And Goals

## Problem Statement
Restaurants need a kiosk ordering experience that helps customers find products quickly, configure meals correctly, review their choices clearly, and complete orders with less friction. At the same time, the system should support structured order handling and provide a user experience that is accessible, reliable, and suitable for real kiosk-style usage.

## Goals
- Allow users to search for products from the menu.
- Allow users to browse menu categories to find products more easily.
- Support one restaurant with multiple menus in the same system.
- Allow categories to be shared across menus.
- Allow products to be shared across menus and categories.
- Allow menu-specific product pricing.
- Allow menus, categories, and products to be shown or hidden based on configured date and time availability.
- Support standalone products, meals, and large meals in the same ordering system.
- Allow customers to build meals from required groups such as sandwich, side, and drink selections.
- Allow customers to personalize products by adding or removing ingredients and choosing supported extra quantities.
- Allow customers to change the kiosk language from the start screen and use the ordering flow in a supported language.
- Provide a clear order summary before checkout.
- Store selected products and their configuration in a basket during the ordering flow.
- Deliver an accessible user interface, including support for stronger contrast and WCAG-oriented usability practices.
- Support secure payment flows in Stripe test mode.
- Provide a strong UI/UX presentation for menu browsing and kiosk ordering.
- Maintain good performance for a smooth kiosk experience.
- Leave room for future upsell and AI-related features in a later phase.

## Non-Goals
- Multi-restaurant management is out of scope for the MVP.
- Real payment processing in production. Only test payment scenarios are in scope.
- Loyalty systems are out of scope for the MVP.
- Automated upsell recommendations are not part of the initial MVP and should be treated as Later.
- AI-driven features are not part of the initial MVP and should be treated as Later.

## Success Criteria
- A customer can find products through search or categories.
- A customer sees only currently available menus, categories, and products according to configured scheduling rules.
- A customer can configure meals and personalize products before adding them to the basket.
- A customer can add configured products to a basket and review the order summary before payment.
- A customer can choose a supported language and see the kiosk interface update consistently for the active ordering flow.
- The interface remains usable for keyboard navigation and visible focus handling, with accessibility-oriented settings considered in the design.
- Payment confirmation is designed around secure backend verification rather than only client-side redirect behavior.
- The project demonstrates clear structure, modern engineering practices, and portfolio-quality documentation.

## Status
Planned. These goals describe intended product direction and should not be treated as implemented functionality.
