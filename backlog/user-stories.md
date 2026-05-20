# User Stories

## Purpose
This document breaks the MVP scope into user-centered stories that can later be converted into implementation tasks.

## EPIC-001: Kiosk Catalog Browsing And Configuration
- `US-001`: As a customer, I want to browse the menu so that I can see what the restaurant offers.
- `US-002`: As a customer, I want to browse menu categories so that I can find products more quickly.
- `US-003`: As a customer, I want to search for products so that I can find a specific item by name or keyword.
- `US-004`: As a customer, I want to open a product and view its details so that I can decide whether to add it to my basket.
- `US-005`: As a customer, I want the catalog to support standalone items, meals, and large meals so that I can order different types of products.
- `US-006`: As a customer, I want to build a meal from required groups such as sandwich, side, and drink so that I can complete my order correctly.
- `US-007`: As a customer, I want to personalize a product by adding or removing ingredients so that the order matches my preferences.
- `US-008`: As a customer, I want to choose quantities for supported extra ingredients so that I can customize my order more precisely.
- `US-009`: As a customer, I want to choose the kiosk language from the start screen so that I can use the application in a language I understand.
- `US-010`: As a customer, I want the selected language to stay active during my ordering flow so that the kiosk does not switch language unexpectedly.

## EPIC-002: Basket And Checkout
- `US-011`: As a customer, I want to add configured products to my basket so that I can build my order.
- `US-012`: As a customer, I want to update or remove configured products in my basket so that I can correct my order before checkout.
- `US-013`: As a customer, I want to review an order summary so that I can confirm my selected products and configuration before payment.
- `US-014`: As a customer, I want the ordering steps to be clear so that I do not get confused during checkout.
- `US-015`: As a customer, I want to return to the previous step before payment so that I can adjust my order if needed.

## EPIC-003: Stripe Test Payment Flow
- `US-016`: As a customer, I want to complete payment using Stripe Checkout test mode so that I can finish my kiosk order.
- `US-017`: As a customer, I want to see clear payment status information so that I understand whether my order is still processing, paid, failed, or cancelled.
- `US-018`: As a customer, I want to receive an order number after successful payment confirmation so that I know the order was accepted.
- `US-019`: As a customer, I want the kiosk to return to the first page after my order is completed so that the terminal is ready for the next user.
- `US-020`: As a customer, I want payment failures to be explained clearly so that I know what to do next without frustration.

## EPIC-004: Admin Authentication
- `US-021`: As an administrator, I want to register an admin account so that I can access the admin area.
- `US-022`: As an administrator, I want to log in securely so that only authorized users can manage orders.
- `US-023`: As an administrator, I want my session to expire after a limited time so that the admin area is safer on shared devices.
- `US-024`: As an administrator, I want to log out clearly so that the next kiosk or device user cannot access my session.

## EPIC-005: Admin Order Management
- `US-025`: As an administrator, I want to view incoming orders so that I can manage restaurant workflow.
- `US-026`: As an administrator, I want to open an order and review its details so that I can understand the selected products, meal choices, and personalizations.
- `US-027`: As an administrator, I want to update order status so that I can track progress from new order to completion.
- `US-028`: As an administrator, I want to see payment status separately from order status so that I do not confuse operational progress with payment confirmation.

## EPIC-006: Accessibility Foundation
- `US-029`: As a customer, I want the kiosk to be touch-friendly so that I can use it comfortably on a terminal screen.
- `US-030`: As a customer, I want visible focus states and keyboard-friendly behavior so that the interface remains accessible.
- `US-031`: As a customer, I want clear confirmations and understandable error messages so that I always know what the system is doing.
- `US-032`: As a customer, I want light and dark mode options so that the interface can remain readable in different usage conditions.
- `US-033`: As a customer, I want larger text or stronger readability options so that the kiosk is easier to use.

## EPIC-007: Security And Validation Foundation
- `US-034`: As an administrator, I want the admin panel to be protected so that customers cannot access sensitive management features.
- `US-035`: As a system owner, I want backend validation of order, meal configuration, and payment data so that the application does not trust unsafe client input.
- `US-036`: As a system owner, I want payment confirmation to depend on verified backend logic so that false payment success states are avoided.
- `US-037`: As a system owner, I want sensitive secrets to stay outside source code so that credentials and configuration remain safer.

## EPIC-008: Project Infrastructure And Quality
- `US-038`: As a developer, I want a clear monorepo project structure so that the application is easier to scale and maintain.
- `US-039`: As a developer, I want shared quality scripts for linting, testing, typechecking, and building so that the project stays consistent.
- `US-040`: As a developer, I want project documentation organized by domain so that implementation and planning stay understandable.
- `US-041`: As a developer, I want CI-ready workflows so that code quality checks can run before merging changes.

## EPIC-009: Menu Structure And Availability
- `US-042`: As a customer, I want to see only the menus that are currently available so that I can order from the correct offering.
- `US-043`: As a customer, I want to see only the categories and products that are currently available so that I do not try to order unavailable options.
- `US-044`: As an administrator, I want the restaurant to support multiple menus so that different offerings can exist at different times.
- `US-045`: As an administrator, I want to reuse categories across menus so that I do not duplicate catalog structure unnecessarily.
- `US-046`: As an administrator, I want to reuse products across menus and categories so that I do not duplicate product records unnecessarily.
- `US-047`: As an administrator, I want products to have menu-specific pricing so that the same product can cost differently in different menus.
- `US-048`: As an administrator, I want to schedule menus, categories, and products by date and time so that the kiosk reflects the restaurant's real availability.
- `US-049`: As an administrator, I want to hide or unhide menus, categories, and products immediately when needed so that unavailable offerings disappear from the kiosk quickly.

## Later / Post-MVP
- `US-LATER-001`: As a customer, I want to see relevant upsell suggestions before finalizing basket choices so that I can easily add complementary products.
- `US-LATER-002`: As a system owner, I want upsell suggestions to be based on configurable recommendation rules so that the feature can evolve without redesigning the whole ordering flow.

## Notes
- These user stories represent planned work and should not be treated as already implemented.
- Technical tasks, acceptance criteria, and estimates should be created from these stories during implementation planning.
