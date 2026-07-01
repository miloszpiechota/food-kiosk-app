# Database Package

This package is reserved for PostgreSQL and Prisma database code.

Planned structure:

```txt
packages/database/
  prisma/
    schema.prisma
    migrations/
  src/
    client.ts
```

Local development uses PostgreSQL installed on your machine. Use pgAdmin to
create and inspect the local `food_kiosk_dev` database.

Default connection string:

```txt
postgresql://postgres:postgres@localhost:5432/food_kiosk_dev
```

If your local PostgreSQL user, password, host, or port differs, update
`DATABASE_URL` in `packages/database/.env` and the root `.env`.

Useful commands from the repo root:

```txt
pnpm db:validate
pnpm db:generate
pnpm db:migrate:dev -- --name init
pnpm db:seed
```
