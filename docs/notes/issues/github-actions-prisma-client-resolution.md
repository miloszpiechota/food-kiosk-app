# GitHub Actions Prisma Client Resolution

## Symptom

GitHub Actions failed during API build or lint with errors such as:

```txt
Cannot find module '../../../../node_modules/@prisma/client/.prisma/client'
Property 'basket' does not exist on type 'PrismaService'
Property '$transaction' does not exist on type 'PrismaService'
```

The first error caused the others. Once TypeScript could not resolve the Prisma generated client, `PrismaService` no longer extended a typed `PrismaClient`, so delegates such as `basket`, `order`, `menuProduct`, and `$transaction` appeared to be missing.

## Cause

Application code imported Prisma from a physical generated-client path inside `node_modules`:

```ts
import { PrismaClient } from "../../../../node_modules/@prisma/client/.prisma/client";
```

That path was fragile. pnpm's physical `node_modules` layout can differ between local Windows installs and GitHub Actions Linux installs.

The schema also used a custom generator output:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../../node_modules/.prisma/client"
}
```

The source import and generated output were not the same path in CI.

## Fix

Use Prisma's default generator output:

```prisma
generator client {
  provider = "prisma-client-js"
}
```

Import Prisma through the public package API:

```ts
import { PrismaClient, Prisma } from "@prisma/client";
```

Generate Prisma Client before quality checks:

```bash
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The CI workflow should run `pnpm db:generate` after `pnpm install --frozen-lockfile` and before jobs that compile, lint, or test TypeScript.

## Verification

Run:

```bash
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected result:

```txt
lint: passed
typecheck: passed
test: passed
build: passed
```

## Rule

Never import application code from generated files inside `node_modules`. Use `@prisma/client` and let Prisma manage the generated-client location.
