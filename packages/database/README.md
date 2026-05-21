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

Local PostgreSQL is provided from the repo root through `docker-compose.yml`.

Default connection string:

```txt
postgresql://postgres:postgres@localhost:5432/food_kiosk_dev
```

Useful commands from the repo root:

```txt
pnpm db:validate
pnpm db:generate
pnpm db:migrate:dev -- --name init
pnpm db:seed
```
