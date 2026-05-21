# Prisma Setup Guide

## Purpose

This document explains what Prisma is, how it is set up in this project, and how the Nest API uses `PrismaModule`, `PrismaService`, and `PrismaClient`.

## What Prisma Is

Prisma is the database access layer for this application.

It provides:

- a schema file that describes database tables, columns, relations, and enums
- migrations that turn schema changes into PostgreSQL database changes
- a generated TypeScript client for type-safe database queries
- seed tooling for loading local development data

In this project, Prisma sits between the NestJS API and PostgreSQL.

```mermaid
flowchart LR
  Controller[Nest Controller] --> Service[Nest Service]
  Service --> PrismaService[PrismaService]
  PrismaService --> PrismaClient[Prisma Client]
  PrismaClient --> Database[(PostgreSQL)]
```

## Where Prisma Lives

The Prisma schema and database tooling live in:

```txt
packages/database
```

Important files:

- `packages/database/prisma/schema.prisma` defines the database model.
- `packages/database/prisma/migrations` stores committed database migrations.
- `packages/database/prisma/seed.mjs` inserts local development seed data.
- `packages/database/package.json` contains Prisma CLI scripts.

The Nest API integration lives in:

```txt
apps/api/src/prisma
```

Important files:

- `apps/api/src/prisma/prisma.module.ts`
- `apps/api/src/prisma/prisma.service.ts`

## What The Prisma Schema Is

The Prisma schema is the source of truth for the database structure.

In this app it defines food kiosk concepts such as:

- restaurants
- menus
- categories
- products
- product groups
- ingredients
- baskets
- orders
- payments
- admin users and sessions

The schema file also defines the PostgreSQL datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

That means Prisma reads the database connection string from `DATABASE_URL`.

## What Prisma Client Is

Prisma Client is the generated TypeScript database client from `@prisma/client`.

After running:

```powershell
pnpm db:generate
```

Prisma reads `schema.prisma` and generates typed query methods.

Example usage inside a Nest service:

```ts
const products = await this.prisma.product.findMany({
  where: {
    isAvailable: true,
  },
});
```

The `product` property comes from the `Product` model in `schema.prisma`. Prisma generates similar properties for each model, such as `restaurant`, `menu`, `category`, `order`, and `payment`.

Prisma Client is used for:

- reading data from PostgreSQL
- creating records
- updating records
- deleting records
- running transactions
- including related records in one query
- getting TypeScript autocomplete and type checking for database access

## What PrismaService Is

`PrismaService` is the Nest wrapper around Prisma Client.

File:

```txt
apps/api/src/prisma/prisma.service.ts
```

It extends `PrismaClient`, so anything available on Prisma Client is also available on `PrismaService`.

Its responsibilities are:

- create the Prisma Client instance
- connect to the database when the Nest module starts
- disconnect cleanly when the Nest module shuts down
- configure Prisma logging
- provide a single injectable database access service for the API

Current implementation behavior:

- In development, Prisma logs warnings and errors.
- In other environments, Prisma logs errors only.
- `onModuleInit` calls `$connect()`.
- `onModuleDestroy` calls `$disconnect()`.
- Nest shutdown hooks are enabled in `main.ts`, and `PrismaService` disconnects during module shutdown.

Future API services should inject `PrismaService` instead of creating new `PrismaClient` instances directly.

## What PrismaModule Is

`PrismaModule` registers `PrismaService` with Nest dependency injection.

File:

```txt
apps/api/src/prisma/prisma.module.ts
```

It is marked with `@Global()`, which means feature modules can inject `PrismaService` without importing `PrismaModule` repeatedly.

The module provides and exports `PrismaService`:

```ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

The root `AppModule` imports `PrismaModule` once:

```ts
@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## How To Set Up Prisma Locally

Run commands from the repository root.

### 1. Create The Prisma Environment File

Create:

```txt
packages/database/.env
```

Add:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/food_kiosk_dev
```

This file is used by Prisma CLI commands.

### 2. Start PostgreSQL

```powershell
pnpm db:up
```

This starts the PostgreSQL container from `docker-compose.yml`.

### 3. Validate The Schema

```powershell
pnpm db:validate
```

This checks whether `schema.prisma` is valid.

### 4. Generate Prisma Client

```powershell
pnpm db:generate
```

This generates the TypeScript client used by `PrismaService`.

Run this after changing `schema.prisma`.

### 5. Apply A Development Migration

For a new schema change, create and apply a migration:

```powershell
pnpm db:migrate:dev -- --name describe_change_here
```

For an existing project checkout, this applies pending development migrations.

### 6. Seed The Database

```powershell
pnpm db:seed
```

This inserts local catalog data so the API and web app can be developed against realistic menu data.

### 7. Optional: Open Prisma Studio

```powershell
pnpm db:studio
```

Prisma Studio opens a browser UI for inspecting and editing local database rows.

Use it for development only.

## Recommended Local Workflow

Use this sequence when setting up a fresh local database:

```powershell
pnpm db:up
pnpm db:validate
pnpm db:generate
pnpm db:migrate:dev -- --name init
pnpm db:seed
pnpm dev:api
```

Use this sequence after changing `schema.prisma`:

```powershell
pnpm db:format
pnpm db:validate
pnpm db:generate
pnpm db:migrate:dev -- --name describe_change_here
```

## How To Use PrismaService In A Feature

Inject `PrismaService` into a Nest service:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableProducts() {
    return this.prisma.product.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }
}
```

Do not create `new PrismaClient()` inside feature services. Use the shared `PrismaService` so connection lifecycle is handled by Nest.

## Migration Rules

When changing the database model:

1. Edit `packages/database/prisma/schema.prisma`.
2. Run `pnpm db:format`.
3. Run `pnpm db:validate`.
4. Run `pnpm db:generate`.
5. Create a migration with `pnpm db:migrate:dev -- --name meaningful_name`.
6. Commit the schema change and migration together.

Do not edit generated Prisma Client files manually.

## Project Notes

- Prisma is used in test/development mode with local PostgreSQL.
- Payment-related data should stay consistent with the project rule that payment status is confirmed through verified webhooks, not only frontend redirects.
- Changes to payment or security database behavior should include tests.
