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
