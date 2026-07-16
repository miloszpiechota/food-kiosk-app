# Project Context

## Project
Food Ordering Kiosk App is a production-style full-stack portfolio project for a self-service restaurant kiosk.

The intended stack is:
- Frontend: React, Vite, TypeScript in `apps/web`
- Backend: NestJS and TypeScript in `apps/api`
- Database: PostgreSQL with Prisma in `packages/database`
- Tooling: pnpm workspace, Docker Compose for local PostgreSQL, GitHub Actions CI
- Payments: Stripe test mode only, with payment status confirmed through a verified backend webhook

## Product Goal
Build a realistic food ordering kiosk that demonstrates full-stack engineering skills:
- Kiosk customer browsing and ordering
- Product categories, menu items, meals, large meals, modifiers, and extras
- Cart and checkout flow
- Stripe test checkout and verified webhook confirmation
- Admin order management
- Accessibility-aware kiosk UI
- Tests, CI, Docker, and deployment documentation

## Current Implementation Snapshot
Keep this section honest. Update it when code changes.

Implemented:
- Monorepo workspace with `apps/web`, `apps/api`, `packages/database`, `docs`, `backlog`, and `.ai`
- React/Vite customer kiosk frontend in `apps/web`
- NestJS backend in `apps/api`
- Prisma schema in `packages/database/prisma/schema.prisma`
- Prisma seed data in `packages/database/prisma/seed.mjs`
- PostgreSQL service in `docker-compose.yml`
- Kiosk catalog API module with active menu, category, product list, and product detail endpoints
- Customer kiosk UI screens for welcome, menu browsing, product details, basket review, and payment result
- Frontend catalog integration with backend menu and product detail endpoints
- Backend basket module with basket creation, configured item writes, quantity updates, removal, and subtotal recalculation
- Backend order module with immutable order snapshot creation from an active basket
- Stripe Checkout test-payment slice with checkout session creation and verified webhook payment confirmation
- Frontend payment result polling after Stripe redirects back to the kiosk
- Meal builder backend validation, pricing, configuration snapshots, and fingerprint-based basket item merging
- Product documentation in `docs/product`
- Architecture documentation in `docs/architecture`
- GitHub Actions CI in `.github/workflows/ci.yml`
- Initial unit/e2e tests for API areas

Planned or incomplete:
- Backend-backed edit mode for existing configured basket items
- Admin authentication and protected admin workflows
- Admin order list, order detail, and order status management
- Admin UI
- End-to-end browser tests
- Accessibility automation
- Deployment setup and deployment docs
- Portfolio-ready README polish

## Repository Map
Use these ownership boundaries unless the user explicitly gives a broader task.

```txt
apps/web
  React frontend application.

apps/api
  NestJS backend application.

packages/database
  Prisma schema, migrations, seed data, and database client support.

docs/product
  Product requirements, MVP scope, journeys, accessibility, security, and payment requirements.

docs/architecture
  System, domain, database, API, Prisma, and structure documentation.

docs/testing
  Testing documentation. Create this folder when testing docs are requested.

docs/deployment
  Deployment documentation. Create this folder when deployment docs are requested.

docs/adr
  Architecture decision records. Create this folder when ADRs are requested.

backlog
  Epics and user stories.

.ai
  AI agent instructions and prompts.

.github/workflows
  CI pipelines.
```

## Work Roadmap
Use this sequence to keep work small and portfolio-friendly:

1. Product docs in `docs/product` - mostly created
2. AI agent instructions in `.ai` - this instruction set
3. Frontend shell in `apps/web` - implemented
4. Mock menu data - present as Prisma seed data
5. Kiosk UI screens - implemented for the customer ordering flow
6. Cart state - implemented through backend basket state and frontend rendering state
7. Backend API - customer catalog, basket, order, and Stripe payment modules implemented; admin modules planned
8. PostgreSQL and Prisma - schema, migrations, seed data, and Prisma integration implemented
9. Tests - partial
10. Docker and CI/CD - local Postgres and CI started; deployment pipeline planned
11. Deploy frontend and backend - planned
12. Polish README and portfolio presentation - planned

## Non-Negotiable Product Rules
- Do not claim planned features are implemented.
- Do not commit secrets or real payment credentials.
- Stripe must stay in test mode.
- Payment status must be confirmed by a verified backend webhook, not by frontend redirect alone.
- Preserve keyboard navigation and visible focus states.
- Keep README concise and recruiter-friendly; put detailed docs in `docs`.
- Prefer small changes that can become focused pull requests.
