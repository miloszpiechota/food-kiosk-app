# Prisma `DATABASE_URL` Resolution Issue

## Summary

While running the first Prisma migration with:

```powershell
pnpm db:migrate:dev -- --name init
```

Prisma failed with:

```txt
Error code: P1012
error: Environment variable not found: DATABASE_URL.
```

## What Caused The Issue

The workspace script runs Prisma through the database package:

```txt
pnpm --filter @food-kiosk/database prisma:migrate:dev
```

That means Prisma executes from `packages/database`, using:

- `packages/database/package.json`
- `packages/database/prisma/schema.prisma`

The project already had a root `.env`, but Prisma did not read that file in this setup. As a result, `env("DATABASE_URL")` inside `packages/database/prisma/schema.prisma` could not be resolved during migration.

## How To Solve It

Create a package-level env file:

Path:

```txt
packages/database/.env
```

Content:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/food_kiosk_dev
```

Then run the migration again from the repository root:

```powershell
pnpm db:migrate:dev -- --name init
```

## Why This Fix Works

Prisma can now resolve `DATABASE_URL` from the same package context where the schema and migration command are executed.

## Verification

After adding `packages/database/.env`, the next expected Prisma step is:

1. Load `packages/database/prisma/schema.prisma`
2. Read `DATABASE_URL`
3. Connect to PostgreSQL
4. Create the first migration and apply it

If migration succeeds, tables should appear in:

```txt
pgAdmin -> food_kiosk_dev -> Schemas -> public -> Tables
```

## Notes

- The root `.env` is still useful for the application runtime.
- The package-level `.env` is currently required for Prisma CLI commands in `packages/database`.
- A later cleanup option is to standardize env loading so the project uses one shared source of truth.
