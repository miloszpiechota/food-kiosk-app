# AI Coding Standards

## Scope Boundaries
Agents must stay inside the relevant area for the task.

| Task type | Allowed paths |
| --- | --- |
| Frontend | `apps/web` only |
| Backend | `apps/api` only |
| Database | `packages/database/prisma/schema.prisma`, `packages/database/prisma/seed.mjs`, and migration files generated from that schema |
| Docs | `docs` and `README.md` only |
| Testing | Test files only, such as `*.spec.ts`, `*.test.ts`, `apps/api/test`, and frontend test files |
| CI | `.github/workflows` only |
| AI instructions | `.ai` only |

If a task needs files outside its boundary, stop and ask for approval or split the work into a second task.

## General Rules
- Make small, focused changes.
- Do not rewrite unrelated files.
- Do not install new dependencies without approval.
- Prefer simple, readable code over clever abstractions.
- Use TypeScript strictly.
- Add or update tests when behavior changes.
- Update docs when behavior changes, but only during a docs task or with explicit approval.
- Keep comments rare and useful.
- Do not invent implemented features in documentation.
- Mark unfinished features as `Planned`, `Incomplete`, or `Later`.

## TypeScript Rules
- Avoid `any`; prefer explicit types, discriminated unions, or narrow interfaces.
- Keep public function inputs and outputs typed.
- Avoid unsafe casts unless there is a short explanation.
- Keep domain values explicit, especially payment status, order status, product type, and selection mode.
- Treat money as server-owned data; avoid floating point calculations for persisted payment/order totals.

## Frontend Rules
- Use React functional components.
- Keep components small and purpose-specific.
- Prefer accessible native elements before custom controls.
- Kiosk buttons must be large, touch-friendly, and keyboard reachable.
- Preserve visible focus states.
- Avoid complex animation unless it improves kiosk usability.
- Use Tailwind after it is configured and approved. Until then, follow the existing styling setup or ask before adding Tailwind.

## Backend Rules
- Validate input at the API boundary.
- Keep controllers thin.
- Put business logic in services.
- Return consistent errors.
- Do not hardcode secrets.
- Do not trust frontend-supplied prices, totals, payment status, role, or order status.
- Use backend-owned calculations and database state for checkout and order decisions.

## Database Rules
- Schema changes must be intentional and mapped to product/architecture needs.
- Keep seed data deterministic and useful for demos.
- Do not add fake secrets, real personal data, or production credentials to seeds.
- Update tests or docs when schema changes affect behavior.

## Payment And Security Rules
- Stripe is test mode only.
- Payment confirmation must be webhook-driven and signature verified.
- Do not mark orders paid from frontend redirects.
- Never log secrets, raw card data, session tokens, password hashes, or webhook signing secrets.
- Admin authentication and authorization must be tested when implemented.

## Git Rules
- One feature per branch.
- One issue per pull request.
- Use clear commit messages.
- Prefer branch names:
  - `feature/*`
  - `fix/*`
  - `docs/*`
  - `chore/*`
  - `test/*`

## Verification Commands
Before calling a change complete, run the relevant command set when practical:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For focused work, also run targeted package commands when useful:

```bash
pnpm --filter @food-kiosk/web test
pnpm --filter @food-kiosk/api test
pnpm --filter @food-kiosk/database prisma:validate
```
