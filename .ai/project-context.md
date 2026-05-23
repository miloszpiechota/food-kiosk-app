# Project Context

## Project
Food Ordering Kiosk App is a production-style full-stack portfolio project for a self-service restaurant kiosk.

The intended stack is:
- Frontend: React, Vite, TypeScript in `apps/web`
- Backend: NestJS and TypeScript in `apps/api`
- Database: PostgreSQL with Prisma in `packages/database`
- Tooling: pnpm workspace, Docker Compose for local PostgreSQL, GitHub Actions CI
- Planned payments: Stripe test mode only, with payment status confirmed through a verified backend webhook

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
- React/Vite frontend shell in `apps/web`
- NestJS backend in `apps/api`
- Prisma schema in `packages/database/prisma/schema.prisma`
- Prisma seed data in `packages/database/prisma/seed.mjs`
- PostgreSQL service in `docker-compose.yml`
- Kiosk catalog API module with active menu, category, product list, and product detail endpoints
- Product documentation in `docs/product`
- Architecture documentation in `docs/architecture`
- GitHub Actions CI in `.github/workflows/ci.yml`
- Initial unit/e2e tests for API areas

Planned or incomplete:
- Production kiosk UI screens
- Frontend catalog integration
- Cart state and order summary
- Backend basket, order, payment, admin, and auth modules
- Stripe Checkout and verified webhook handling
- Admin UI and protected admin workflows
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
3. Frontend shell in `apps/web` - present but still Vite starter content
4. Mock menu data - present as Prisma seed data
5. Kiosk UI screens - planned
6. Cart state - planned
7. Backend API - catalog API started, other modules planned
8. PostgreSQL and Prisma - schema and seed started
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
