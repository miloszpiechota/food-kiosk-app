# Portfolio Diagram Guide

## Purpose

This document explains the main diagram types that are useful for the Food Ordering Kiosk App and provides a concrete specification for building the first portfolio diagram in draw.io (diagrams.net).

The diagrams should explain the real system clearly without claiming that planned work is already implemented. Keep editable `.drawio` source files in the repository and export SVG versions for documentation and portfolio use.

## Recommended Diagram Set

| Priority | Diagram | Main question answered | Source documentation |
| --- | --- | --- | --- |
| 1 | C4 System Context | Who uses the platform and which external systems does it communicate with? | `01-system-overview.md` |
| 2 | C4 Container | What applications and data stores make up the platform? | `01-system-overview.md`, `02-application-structure.md` |
| 3 | Customer order and Stripe sequence | What happens from basket checkout to verified payment? | `10-basket-pricing-flow.md`, `11-stripe-checkout-flow.md` |
| 4 | Order and payment state diagrams | Which state changes are allowed, and why are order and payment states separate? | `11-stripe-checkout-flow.md`, `12-admin-auth-and-order-management.md` |
| 5 | Admin invitation and 2FA BPMN | How does a worker become an active administrator? | `12-admin-auth-and-order-management.md` |
| 6 | Database ER diagrams | How are restaurants, menus, products, meals, baskets, orders, and admins related? | `03-domain-model.md`, `04-database-model.md`, Prisma schema |
| 7 | Menu visibility DMN table | Under which conditions is a product or meal shown on the kiosk? | `06-api-endpoint-design.md`, `09-meal-builder-design.md` |
| 8 | Deployment and trust-boundary diagram | Where does the system run and where do trusted and untrusted data cross boundaries? | deployment and security documentation |

## C4 Model

The C4 model describes software architecture at four levels of detail. Each level answers a different question.

### Level 1: System Context

Shows:

- people and roles using the system
- the whole software system as one box
- external software systems it depends on
- labelled relationships between them

It answers: **Who uses this system, what value do they receive, and what other systems are involved?**

A System Context diagram does not show React components, NestJS modules, PostgreSQL tables, Prisma, internal APIs, or deployment nodes. Those details belong to later diagrams.

### Level 2: Container

In C4, a container means a separately running or deployable application or data store. It does not mean only a Docker container.

For this project, the future Container diagram should include:

- React web application containing the kiosk and admin experiences
- NestJS backend API
- PostgreSQL database
- Stripe as an external payment system
- Resend as an external email system

It answers: **What are the major technical building blocks and how do they communicate?**

### Level 3: Component

Shows important modules inside one container. A NestJS API component diagram could show:

- kiosk catalog module
- meal configuration and pricing service
- basket module
- order module
- Stripe checkout and webhook modules
- admin authentication module
- admin order and menu-management modules
- Prisma data-access service

It answers: **Which major modules implement this application's responsibilities?**

Only create component diagrams where they add useful information. One diagram for the entire codebase would be too crowded.

### Level 4: Code

Shows classes, interfaces, functions, or other code-level structures. This level is usually unnecessary for a portfolio because the TypeScript code and tests already provide this detail. Use it only to explain one genuinely complex implementation.

### draw.io C4 Data Fields

The draw.io C4 shapes can expose editable data fields such as `c4Name`, `c4Type`, `c4Description`, and `c4Technology`. These fields describe the selected C4 element; they are not application variables or database columns.

To edit them, select the shape and use `Edit Data` from the context menu when that option is available. Some C4 library shapes automatically provide the appropriate `c4Type`.

#### `c4Name`

The short, human-readable name shown as the element title.

Examples:

- person: `Kiosk Customer`
- system: `Food Ordering Kiosk Platform`
- container: `NestJS Backend API`
- database container: `PostgreSQL Database`

Do not put a long explanation or technology list in `c4Name`.

#### `c4Type`

The architectural classification of the element. It does not mean a TypeScript type.

Recommended values:

- `Person`
- `Software System`
- `External Software System`
- `Container`
- `Database Container`
- `Component`

If the selected draw.io shape already displays a suitable type such as `Person` or `Container`, keep that generated value.

#### `c4Description`

A short sentence describing the element's role or responsibility. Describe what value it provides, not how its code works.

Examples:

- person: `Restaurant worker who manages orders and menu visibility for assigned restaurants.`
- system: `Provides kiosk ordering, verified Stripe test payments, and protected restaurant administration.`
- container: `Validates requests, applies business rules, calculates trusted prices, and integrates with external services.`
- database: `Stores restaurant, catalog, basket, order, payment, and administrator data.`

Keep the description to one or two short sentences so the diagram remains readable.

#### `c4Technology`

The principal implementation technology used by a container or component.

Examples for this project:

- React web application: `React, TypeScript`
- backend API: `NestJS, TypeScript, Prisma`
- database: `PostgreSQL`
- component: a specific NestJS module or service technology only when it adds useful information

Leave `c4Technology` empty for people. Usually leave it empty in the System Context diagram because that level describes users and systems rather than implementation details. External products can be identified by their names without repeating them as technology.

### Field Values For The System Context Diagram

| Element | `c4Name` | `c4Type` | `c4Description` | `c4Technology` |
| --- | --- | --- | --- | --- |
| Customer | `Kiosk Customer` | `Person` | `Browses available menus, configures meals, places orders, and completes test payments.` | Leave empty |
| Restaurant worker | `Restaurant Admin` | `Person` | `Manages orders and menu visibility for assigned restaurants.` | Leave empty |
| Company administrator | `Super Admin` | `Person` | `Invites administrators and performs company-level platform administration.` | Leave empty |
| Platform | `Food Ordering Kiosk Platform` | `Software System` | `Provides kiosk ordering, backend pricing, Stripe test payments, and protected multi-restaurant administration.` | Leave empty |
| Payment provider | `Stripe` | `External Software System` | `Hosts test Checkout and sends signed payment webhook events.` | Leave empty |
| Email provider | `Resend` | `External Software System` | `Delivers administrator invitation and password-reset emails.` | Leave empty |
| Authenticator | `TOTP Authenticator App` | `External Software System` | `Generates time-based six-digit codes locally for mandatory administrator 2FA.` | Leave empty |

### Should The Database Be Included?

Do not include PostgreSQL in the **System Context diagram**. At that level, the entire Food Ordering Kiosk Platform is represented as one software system, and its internal database is hidden inside that system.

Include PostgreSQL in the **Container diagram** because a database is a C4 container: it is a separately running data store used by the backend.

Use these Container-diagram values:

| Field | Value |
| --- | --- |
| `c4Name` | `PostgreSQL Database` |
| `c4Type` | `Database Container` |
| `c4Description` | `Stores restaurants, menus, products, meal configurations, baskets, orders, payments, admin accounts, sessions, and audit records.` |
| `c4Technology` | `PostgreSQL` |

Draw the database inside the `Food Ordering Kiosk Platform` boundary and connect only the NestJS Backend API to it:

```text
NestJS Backend API -> PostgreSQL Database
Reads and writes application data using Prisma
```

Do not connect the React application, kiosk customer, or administrators directly to PostgreSQL. All database access goes through the backend API.

### Most Important C4 Rules

1. Give every diagram a clear title and scope.
2. Give every person and system a meaningful name and one-sentence responsibility.
3. Label relationships with active verbs, for example `Places kiosk orders`, not `Uses`.
4. Show the technology only where it helps. Technology details mainly belong in Container and Component diagrams.
5. Draw a clear boundary around the software system being described.
6. Include a small legend when colors or line styles carry meaning.
7. Keep each diagram at one abstraction level.
8. Prefer a small readable diagram over a complete but crowded diagram.
9. Make arrow direction and communication purpose unambiguous.
10. Update the diagram when architecture or implemented behavior changes.

## First Diagram: C4 System Context

### Diagram Title

`Food Ordering Kiosk Platform - System Context`

### Scope Statement

Place this subtitle below the title:

`Customer kiosk ordering, verified Stripe test payments, and multi-restaurant administration.`

### Central System

Create one large central rectangle with a visible system boundary.

**Name:** `Food Ordering Kiosk Platform`

**Type label:** `Software System`

**Description:**

`Provides kiosk menu browsing, configurable meal ordering, backend-priced baskets, Stripe test checkout, and protected restaurant administration.`

Do not split this box into frontend, API, or database yet.

### People

Place these people on the left side.

#### Kiosk Customer

**Description:**

`Browses an available restaurant menu, configures products and meals, reviews the basket, and completes a test payment.`

**Relationship to platform:**

`Browses menus, configures meals, and places orders through the kiosk`

#### Restaurant Admin

**Description:**

`Operates assigned restaurants and can inspect orders, update order status, review payment state, and manage menu visibility.`

**Relationship to platform:**

`Manages assigned restaurant orders and menu visibility through the admin panel`

#### Super Admin

**Description:**

`Company-level administrator who can invite administrators and perform restaurant administration across the platform.`

**Relationship to platform:**

`Invites administrators and manages platform-level administration`

Keep Restaurant Admin and Super Admin separate because their authorization boundaries are an important part of the project.

### External Systems

Place external systems on the right side.

#### Stripe

**Type label:** `External Payment System - Test Mode`

**Description:**

`Hosts Checkout and sends signed webhook events used by the backend to confirm payment state.`

**Relationships:**

- Platform to Stripe: `Creates Checkout sessions using backend-validated order totals`
- Stripe to Platform: `Sends signed payment webhook events`
- Kiosk Customer to Stripe: `Completes a test payment on hosted Checkout`

The arrow from Stripe to the platform is important because it shows that payment is confirmed by a verified webhook, not by the browser redirect.

#### Resend

**Type label:** `External Email Delivery System`

**Description:**

`Delivers administrator invitation and password-reset emails in the production email configuration.`

**Relationship from platform:**

`Sends administrator invitations and password-reset emails`

#### TOTP Authenticator App

**Type label:** `External User Device Application`

**Description:**

`Stores the enrolled TOTP secret and generates six-digit codes required for administrator authentication.`

**Relationships:**

- Admin roles to authenticator app: `Scans enrollment QR code and reads time-based verification codes`
- Admin roles to platform: `Submits a six-digit TOTP or one-time recovery code`

Add a note beside this system:

`No network API connection: the authenticator generates codes locally from the enrolled secret.`

Use a generic name rather than only `Google Authenticator`, because any compatible RFC 6238 authenticator can be used.

### Elements That Must Not Appear

Do not add these to the System Context diagram:

- React
- NestJS
- Prisma
- PostgreSQL
- Docker
- individual API endpoints
- admin cookies or session tables
- controllers, services, repositories, or database entities

They will appear in the Container, Component, sequence, deployment, or ER diagrams.

### Suggested draw.io Layout

Use a landscape 16:9 canvas.

```text
+---------------------------------------------------------------------------+
| Food Ordering Kiosk Platform - System Context                             |
|                                                                           |
|  [Kiosk Customer]       +--------------------------+       [Stripe]        |
|          -------------> |                          | <----- webhook        |
|                         | Food Ordering Kiosk      | -----> checkout       |
|  [Restaurant Admin] --> | Platform                 |       [Resend]        |
|                         |                          | -----> email           |
|  [Super Admin] -------> +--------------------------+                       |
|        |                                                  [Authenticator] |
|        +---------------- enrollment/code ---------------->                |
+---------------------------------------------------------------------------+
```

This is a placement guide, not the final visual notation. Route connectors so that they do not cross labels or other connectors.

### Suggested Visual Style

- central platform: strong blue fill, white text
- people: white or light gray with dark text
- external systems: muted gray fill
- security-related authenticator: restrained green accent
- system boundary: thin solid border with a boundary label
- synchronous requests: solid arrows
- webhook or asynchronous delivery: dashed arrows
- maximum two font sizes inside diagram elements
- short descriptions and generous spacing

Include a small legend:

- solid arrow: direct interaction or request
- dashed arrow: asynchronous notification or delivery
- blue box: system in scope
- gray box: external system

### Review Checklist

Before exporting the diagram, verify:

- a non-technical reviewer can understand the platform in under one minute
- all arrows have descriptive labels
- Stripe webhook verification is visible
- Restaurant Admin and Super Admin are separate
- TOTP is shown without implying a network connection to the authenticator app
- no implementation-level components appear
- text is readable at normal portfolio page width
- the editable `.drawio` source and exported SVG contain the same version

## ER Diagrams

ERD means **Entity-Relationship Diagram**. It describes persistent data entities and the relationships between them.

An ER diagram normally contains:

- entities or tables, such as `Restaurant`, `Menu`, `Product`, and `Order`
- important attributes or columns
- primary keys (`PK`)
- foreign keys (`FK`)
- relationship cardinality: one-to-one, one-to-many, or many-to-many
- optionality: required or optional relationship

Crow's-foot notation is commonly used. For example:

```text
Restaurant 1 -----< Menu
Menu 1 -----< MenuCategory >----- 1 Category
MenuCategory 1 -----< MenuProduct >----- 1 Product
Order 1 -----< OrderItem
```

This means one restaurant can have many menus, and the join entities allow reusable categories and products to be assigned to menus.

Do not put every database table in one portfolio ERD. Create four focused diagrams:

1. Restaurant, menu, category, and product catalog.
2. Meal groups, group options, modifiers, and ingredients.
3. Basket, basket items, orders, order items, and payments.
4. Admin users, restaurant access, invitations, sessions, challenges, recovery codes, and audit logs.

The Prisma schema is the implementation source of truth. The ER diagrams should simplify it without changing its relationships.

## DMN Decision Tables

DMN means **Decision Model and Notation**. BPMN describes a process; DMN describes a decision made inside that process.

A DMN decision table contains:

- input columns
- ordered business rules
- output columns
- a hit policy that defines how matching rules are evaluated
- optional annotations explaining each rule

For this project, a useful decision is `Should a menu product be visible on the kiosk?`

Possible input columns:

- restaurant active
- menu active and currently scheduled
- category visible and available
- menu product visible and available
- product available
- product type
- every required meal group has at least one visible and available option

Possible outputs:

- `SHOW` or `HIDE`
- reason code such as `MENU_INACTIVE`, `PRODUCT_HIDDEN`, or `REQUIRED_GROUP_EMPTY`

Simplified example:

| Restaurant active | Menu active now | Product visible | Required meal groups valid | Result | Reason |
| --- | --- | --- | --- | --- | --- |
| No | Any | Any | Any | HIDE | RESTAURANT_INACTIVE |
| Yes | No | Any | Any | HIDE | MENU_INACTIVE |
| Yes | Yes | No | Any | HIDE | PRODUCT_HIDDEN |
| Yes | Yes | Yes | No | HIDE | REQUIRED_GROUP_EMPTY |
| Yes | Yes | Yes | Yes | SHOW | AVAILABLE |

The final decision model needs additional category, schedule, and exception rules. The table above explains the idea and must not be treated as the complete backend algorithm.

Use Camunda Modeler for formal DMN files or draw.io for a portfolio-only visual table. If the table is intended to become executable business logic, use a real DMN modeler and tests rather than a drawing.

## BPMN Diagrams

BPMN describes a business process across people and systems. Its key elements are:

- start and end events
- user tasks and service tasks
- exclusive or parallel gateways
- timer and error events
- pools for separate participants
- lanes for roles within one participant
- sequence flows within a pool
- message flows between pools

The first BPMN diagram for this project should be `Administrator Invitation and Mandatory 2FA Enrollment`.

Suggested pools or lanes:

- Super Admin
- Food Ordering Kiosk Platform
- Email Provider
- Invited Worker
- TOTP Authenticator App

Model invite expiration, invalid tokens, password validation, QR/manual enrollment, invalid TOTP retries, successful activation, and setup cancellation. Do not model every controller or database query.

## Sequence Diagrams

Sequence diagrams show technical communication in chronological order. They are better than BPMN for request-response details.

The most important sequence diagrams for this project are:

1. Add configured meal to basket and calculate backend price.
2. Create order and Stripe Checkout Session.
3. Process Stripe webhook and confirm payment.
4. Admin login with password and mandatory TOTP challenge.
5. Publish or update a menu product once backend menu-write endpoints are implemented.

Use participants such as Browser, React Web, NestJS API, PostgreSQL, Stripe, and Resend. Include failed branches only when they explain important behavior.

## State Diagrams

State diagrams describe the valid lifecycle of one entity. They should show states, allowed transitions, transition triggers, and terminal states.

Create separate diagrams for:

- basket state
- order status
- payment status
- admin invite status
- admin account setup and activation status

Do not combine order status and payment status into one state machine. They represent different concerns and can change independently.

## Deployment And Trust-Boundary Diagram

This diagram should show runtime infrastructure and security boundaries rather than business behavior.

Include:

- kiosk or administrator browser
- frontend hosting
- NestJS API runtime
- PostgreSQL
- Stripe and Resend
- HTTPS connections
- webhook entry point and signature verification
- environment secrets on the backend only
- HTTP-only admin session cookie boundary

Create this after deployment hosting choices are final. Until then, mark hosting nodes as planned or provider-neutral.

## File And Export Convention

Recommended future structure:

```text
docs/diagrams/
  c4/
    system-context.drawio
    system-context.svg
    container.drawio
    container.svg
  bpmn/
    admin-invitation-and-2fa.bpmn
    admin-invitation-and-2fa.svg
  erd/
    catalog.drawio
    catalog.svg
  dmn/
    menu-product-visibility.dmn
    menu-product-visibility.svg
```

Use SVG for the portfolio because it remains sharp at different screen sizes. Keep the editable source file as the source of truth; do not manually edit the exported SVG.
