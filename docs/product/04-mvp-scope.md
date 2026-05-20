# MVP Scope

## Purpose
Define the minimum viable product for the Food Ordering Kiosk App so the first implementation stays focused on the most important customer and admin workflows.

## In Scope For MVP
- Kiosk customer can browse the menu.
- Kiosk customer can search for products.
- Kiosk customer can filter products by category.
- Kiosk customer can select a supported language from the start screen.
- The system supports one restaurant with multiple menus.
- Categories can be shared across menus.
- Products can be shared across menus and categories.
- Products can have menu-specific pricing.
- Menus, categories, and products can have time-based availability and visibility rules.
- The catalog supports standalone products, meals, and large meals.
- Kiosk customer can configure required meal groups before adding a meal to the basket.
- Kiosk customer can personalize products by adding or removing ingredients and selecting supported extra quantities.
- Kiosk customer can add configured products to a basket.
- Kiosk customer can review an order summary before checkout.
- Kiosk customer can complete checkout using Stripe test mode.
- Backend confirms payment through verified backend flow rather than frontend redirect only.
- Confirmed orders are stored and available for admin management.
- Restaurant admin has an authentication flow to access the admin area.
- Restaurant admin can log in to the admin panel.
- Restaurant admin can view incoming orders.
- Restaurant admin can manage order status.
- The application includes accessibility-oriented UI decisions for kiosk usage.

## Out Of Scope For MVP
- Multi-restaurant management
- Real production payment processing
- Loyalty or rewards system
- Automated upsell recommendations during the kiosk flow
- AI-driven recommendations or AI assistant features
- Advanced analytics or reporting dashboards
- Multi-location restaurant management
- Complex promotion, discount, or coupon systems

## Later
- Automated upsell suggestions shown before basket confirmation
- AI-related features for menu assistance, recommendations, or admin support
- Extended admin management capabilities
- Broader reporting and analytics
- More advanced customer personalization features
- Expanded multilingual coverage beyond the initial supported kiosk languages if needed

## Authentication Scope
- Customers do not need to register or log in to place an order through the kiosk.
- Authentication is required only for administrators accessing the admin panel.
- Admin registration and login should be treated as part of the protected administration flow.

## MVP Success Definition
The MVP is successful if a customer can place an order from a kiosk without logging in, complete a Stripe test payment flow, and the restaurant admin can securely access an admin area to view and manage the resulting order.

## Status
Planned. This scope definition is part of discovery and should not be interpreted as implemented functionality.
