# MVP Scope

## Purpose
Define the minimum viable product for the Food Ordering Kiosk App so the first implementation stays focused on the most important customer and admin workflows.

## In Scope For MVP
- Kiosk customer can browse the menu.
- Kiosk customer can search for products.
- Kiosk customer can filter products by category.
- Kiosk customer can select a supported language from the start screen.
- The system supports many restaurants, each with its own menus, categories, products, orders, and admin access.
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
- A company-level super admin can invite selected restaurant workers into the admin panel.
- Restaurant admins can accept invite links and complete mandatory two-factor authentication setup.
- Admins can log in with email, password, and a required two-factor code.
- The admin login design can later support QR-assisted login through a trusted-device flow.
- Restaurant admins can view, search, and filter incoming orders for assigned restaurants.
- Restaurant admins can open order details including ordered items, ids, payment method, payment status, and total price.
- Restaurant admins can manage order status.
- Restaurant admins can search menu items and hide or unhide products for assigned restaurants.
- Hidden meal-option products must affect kiosk meal availability so meals with no available option in a required group are not shown.
- The application includes accessibility-oriented UI decisions for kiosk usage.

## Out Of Scope For MVP
- Real production payment processing
- Loyalty or rewards system
- Automated upsell recommendations during the kiosk flow
- AI-driven recommendations or AI assistant features
- Advanced analytics or reporting dashboards
- Complex organization and multi-location hierarchy beyond restaurant-level access
- Complex promotion, discount, or coupon systems

## Later
- Automated upsell suggestions shown before basket confirmation
- AI-related features for menu assistance, recommendations, or admin support
- Advanced admin management capabilities beyond invite, access, order, and menu visibility operations
- Broader reporting and analytics
- More advanced customer personalization features
- Expanded multilingual coverage beyond the initial supported kiosk languages if needed

## Authentication Scope
- Customers do not need to register or log in to place an order through the kiosk.
- Authentication is required only for administrators accessing the admin panel.
- Admin self-registration is not part of the normal flow; admins should be invited by a super admin.
- Admin login requires email, password, and mandatory two-factor authentication.
- QR-assisted login is allowed only as a secure trusted-device flow, not as a replacement for initial identity proof.

## MVP Success Definition
The MVP is successful if a customer can place an order from a kiosk without logging in, complete a Stripe test payment flow, and assigned restaurant admins can securely access an admin area to view, search, and manage resulting orders for their restaurants.

## Status
Planned. This scope definition is part of discovery and should not be interpreted as implemented functionality.
