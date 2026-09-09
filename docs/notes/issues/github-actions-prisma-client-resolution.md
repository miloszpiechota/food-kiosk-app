# GitHub Actions Prisma Client Resolution

## Symptom

GitHub Actions failed during API build or lint with errors such as:

```txt
Cannot find module '../../../../node_modules/@prisma/client/.prisma/client'
Property 'basket' does not exist on type 'PrismaService'
Property '$transaction' does not exist on type 'PrismaService'
```

Another form of the same issue is a large lint failure where API files report unsafe Prisma usage:

```txt
Unsafe member access .basket on a type that cannot be resolved
Unsafe member access .PAID on a type that cannot be resolved
Unsafe construction of a type that could not be resolved
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

With pnpm workspaces, `apps/api` and `packages/database` can also resolve separate physical `@prisma/client` package instances when their peer dependency sets differ. In this project that happened when the API package used TypeScript 5 while the rest of the workspace used TypeScript 6. Running Prisma generate only inside `packages/database` left the API package's client instance without generated types, even though `pnpm db:generate` appeared to have run before lint.

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

The root `pnpm db:generate` script must generate both workspace client instances:

```json
"db:generate": "pnpm --filter @food-kiosk/database prisma:generate && pnpm --filter @food-kiosk/api prisma:generate"
```

The API package points Prisma at the shared schema:

```json
"prisma:generate": "prisma generate --schema ../../packages/database/prisma/schema.prisma"
```

Keep the API package on the same TypeScript peer line as the rest of the workspace so pnpm resolves one physical `@prisma/client` package:

```json
"typescript": "~6.0.2"
```

The API package also owns a Prisma CLI dev dependency so filtered API commands can run Prisma directly:

```json
"prisma": "^6.19.3"
```

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
