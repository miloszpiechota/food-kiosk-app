# Prisma Client, TypeScript, And Tooling Issues

## Summary

During Prisma/Nest setup, several local checks failed even after the database, migrations, and seed data were working.

Main symptoms:

```txt
Module '"@prisma/client"' has no exported member 'PrismaClient'.
```

```txt
error TS5103: Invalid value for '--ignoreDeprecations'.
```

```txt
Cannot find module 'picomatch/index.js'
Cannot find module './types'
Cannot find module 'source-map'
```

```txt
ReferenceError: exports is not defined
```

The affected commands were:

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
```

## What Caused The Issue

There were multiple causes.

### Mixed Prisma Versions

The root project and workspace packages did not agree on Prisma versions. Some package ranges pointed to Prisma 7 while the installed workspace resolved Prisma 6.

That made `@prisma/client` unreliable from TypeScript's point of view.

### Prisma Client Generation Path

The generated Prisma Client existed, but an earlier workaround imported it through a physical `node_modules` path. That worked locally on Windows for a while but failed in GitHub Actions on Linux.

The failing import was:

```ts
import { PrismaClient } from "../../../../node_modules/@prisma/client/.prisma/client";
```

### Invalid TypeScript Deprecation Setting

The API `tsconfig.json` briefly used:

```json
"ignoreDeprecations": "6.0"
```

The installed TypeScript version rejected that value, so both typecheck and build failed.

### Corrupted `node_modules`

Several test failures were caused by incomplete package folders inside `node_modules`, not by application code.

Examples:

- `picomatch@2.3.2` was missing `index.js`
- `ts-jest` could not load `./types`
- `source-map@0.6.1` was missing runtime files

This happened after interrupted installs and Windows file-lock issues.

### Nest CLI Build Dependency Issue

`nest build` loaded `glob@13`, which failed at runtime on this local Node/Windows setup with:

```txt
ReferenceError: exports is not defined
```

The API does not need the Nest CLI wrapper for this project stage, so using TypeScript directly is simpler and more stable.

## How To Solve It

### 1. Align Prisma Versions

Use one Prisma major version across the root project and workspace packages.

Current version:

```txt
prisma: ^6.19.3
@prisma/client: ^6.19.3
```

### 2. Use Prisma's Default Client Output

Use the standard Prisma Client generator without a custom `output` path:

```prisma
generator client {
  provider = "prisma-client-js"
}
```

Then generate the client:

```powershell
pnpm.cmd db:generate
```

In CI, run the same command after `pnpm install --frozen-lockfile` and before `lint`, `typecheck`, `test`, or `build`.

### 3. Import Prisma Through The Public Package

```ts
import { PrismaClient, Prisma } from "@prisma/client";
```

Do not import from `node_modules/.prisma/client` or `node_modules/@prisma/client/.prisma/client`. Those paths are package-manager internals and can differ between Windows, Linux, pnpm versions, and CI installs.

### 4. Remove Invalid `ignoreDeprecations`

Remove this from `apps/api/tsconfig.json`:

```json
"ignoreDeprecations": "6.0"
```

The installed TypeScript version does not accept that value.

### 5. Fix API Bootstrap Lint Errors

Use:

```ts
void bootstrap();
```

This satisfies the lint rule that promises must be handled.

Also remove unused imports from `main.ts`.

### 6. Build API With TypeScript

Update the API build script:

```json
"build": "tsc -p tsconfig.build.json"
```

Then set an explicit build root in `apps/api/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

This avoids the local `nest build` / `glob@13` runtime failure.

### 7. Replace Broken `ts-jest` Runtime Usage

The API test config now uses a small local transformer:

```txt
apps/api/test/typescript-jest-transformer.cjs
```

The Jest transform points to that file instead of loading `ts-jest` directly.

### 8. Repair Corrupted Dependencies

When package files are missing from `node_modules`, do a clean reinstall:

```powershell
cd C:\Users\Milosz\Desktop\food-kiosk-app

Stop-Process -Name node -Force -ErrorAction SilentlyContinue

Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue

pnpm.cmd store prune

$env:CI="true"
pnpm.cmd install --force --no-frozen-lockfile
pnpm.cmd db:generate
```

If Windows reports `EPERM` for Prisma engine files, reboot Windows and rerun the install before starting dev servers, Prisma Studio, or VS Code background tasks.

## Why This Fix Works

- Prisma CLI and Prisma Client now use the same version line.
- The generated client is managed by Prisma and exposed through `@prisma/client`.
- Source code no longer depends on OS-specific `node_modules` layout details.
- TypeScript no longer receives an unsupported `ignoreDeprecations` value.
- API build uses TypeScript directly and avoids the broken local Nest CLI dependency path.
- Tests no longer rely on a broken `ts-jest` runtime entrypoint.
- A clean install restores missing package runtime files.

## Verification

After applying the fixes and reinstalling dependencies, all required checks passed:

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
```

Expected result:

```txt
typecheck: passed
lint: passed
test: passed
build: passed
```

## Notes

- Use `pnpm.cmd` on this Windows machine because PowerShell blocks `pnpm.ps1`.
- Do not commit generated `node_modules`, `dist`, `*.tsbuildinfo`, or `package-lock.json`.
- If similar missing-module errors appear again, suspect a corrupted install before changing application code.
