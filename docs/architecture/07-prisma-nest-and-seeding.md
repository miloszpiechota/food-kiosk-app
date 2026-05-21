# Prisma, Nest Integration, and Seeding

## Purpose

This document explains how the data layer is wired in the monorepo after the Prisma schema was designed.

For a beginner-friendly explanation of what Prisma, Prisma Client, `PrismaModule`, and `PrismaService` are, see [08-prisma-setup-guide.md](./08-prisma-setup-guide.md).

## Responsibilities By Folder

### `packages/database`

This package owns:

- Prisma schema
- migrations
- Prisma validation/generation scripts
- seed script

Main files:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/seed.mjs`
- `packages/database/package.json`

### `apps/api`

The Nest API owns:

- request handling
- application services
- validation and authorization
- data access through `PrismaService`

Main files added for integration:

- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/src/prisma/prisma.module.ts`

## Why Prisma Lives In `packages/database`

This keeps schema and database tooling centralized for the whole monorepo.

Benefits:

- one source of truth for schema design
- one place for migration scripts
- one place for seed data
- easier reuse later if other packages need Prisma types or shared DB tooling

## How Nest Uses Prisma

The API now has a dedicated Prisma integration layer.

### `PrismaService`

`PrismaService` extends `PrismaClient` and handles:

- database connection on Nest module init
- clean disconnection on Nest shutdown
- shared configuration for Prisma logging

### `PrismaModule`

`PrismaModule` is global and exports `PrismaService`.

That means future feature modules can inject Prisma directly without re-declaring the provider in every module.

## Seed Strategy

The project now includes a real development seed script.

Current seed data includes:

- one restaurant
- one active menu
- localized category data
- standalone products
- meals and large meals
- meal group templates
- meal options with price adjustments
- product ingredients
- product modifier groups and modifier options

The seed is intentionally catalog-focused so the first backend/frontend slice can browse real kiosk data before auth, checkout, and admin flows are fully implemented.

## Commands

Run these from the repository root.

### Start PostgreSQL

```powershell
pnpm db:up
```

### Validate Prisma Schema

```powershell
pnpm db:validate
```

### Generate Prisma Client

```powershell
pnpm db:generate
```

### Create Or Apply Development Migration

```powershell
pnpm db:migrate:dev -- --name init
```

### Seed The Database

```powershell
pnpm db:seed
```

## Environment Notes

For Prisma CLI commands, the current setup expects:

```txt
packages/database/.env
```

with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/food_kiosk_dev
```

The root `.env` still exists for application runtime concerns.

## Recommended Local Workflow

Use this sequence during local development:

1. `pnpm db:up`
2. `pnpm db:migrate:dev -- --name init`
3. `pnpm db:seed`
4. `pnpm dev:api`
5. `pnpm dev:web`

That gives the API and frontend real catalog data from the start.

## Why Seed Before Endpoints

Seed data matters early because:

- menu browsing needs realistic product structures
- meal configuration needs real group and option records
- personalization needs real ingredient/modifier data
- localization needs real translated content

Without seed data, endpoint work tends to drift toward fake or incomplete assumptions.

## Next Backend Step

After seeding and Prisma integration, the next implementation step should be read-only kiosk catalog endpoints:

1. active menu
2. menu categories
3. menu product detail

That sequence matches the main user journey and exercises the most important parts of the schema without introducing payment or admin complexity too early.
