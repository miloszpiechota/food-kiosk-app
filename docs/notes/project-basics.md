# Project Basics

This note explains a few core project concepts used in this repository.

## 1. `pnpm` vs `npm` vs `yarn`

All three are JavaScript package managers. They install dependencies, run scripts, and manage lockfiles.

### `npm`

- Default package manager that comes with Node.js
- Very common and simple to start with
- Uses `package-lock.json`

### `yarn`

- Alternative package manager created to improve speed and workflow
- Popular in many frontend projects
- Usually uses `yarn.lock`

### `pnpm`

- Alternative package manager focused on speed, disk efficiency, and strict dependency management
- Uses `pnpm-lock.yaml`
- Stores packages in a shared content-addressable store and links them into projects instead of copying everything repeatedly
- Works very well for monorepos

### Why This Project Uses `pnpm`

- Better fit for workspaces and monorepos
- Faster installs in repeated development workflows
- Stronger dependency isolation, which helps catch bad package assumptions earlier

## 2. What These Files Do

### `pnpm-workspace.yaml`

This file tells `pnpm` which folders belong to the workspace.

In this project:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

That means `pnpm` treats every app in `apps/*` and every shared package in `packages/*` as part of one workspace.

### Root `package.json`

This is the main project manifest for the whole repository.

It usually contains:

- root scripts like `pnpm lint`, `pnpm test`, `pnpm build`
- shared tool dependencies
- project metadata

In this repo, it acts as the main control point for workspace-level commands.

### `apps/web/package.json`

This file defines the frontend app itself.

It contains:

- frontend dependencies like `react`, `vite`
- scripts for the web app only, such as `dev`, `build`, `test`, and `typecheck`

### `packages/*/package.json`

Each package inside `packages/*` can have its own `package.json`.

Example:

- `packages/database/package.json`

These files define package-specific:

- dependencies
- scripts
- build behavior

This is useful when the monorepo contains reusable internal packages, not only apps.

### `pnpm-lock.yaml`

This lockfile stores the exact resolved versions of installed dependencies.

It makes installs reproducible across machines and CI.

Without it, two developers could install slightly different dependency trees even if `package.json` looks the same.

## 3. What `lint` Means

Linting is automated code quality checking.

A linter looks for:

- syntax or style issues
- unsafe patterns
- unused variables
- common mistakes
- formatting inconsistencies, depending on configuration

In this project, `pnpm lint` runs the configured linters across workspace packages.

Linting does not run the app. It checks code quality rules.

## 4. What `MVP`, `Personas`, and `User Journeys` Mean

### MVP

`MVP` means `Minimum Viable Product`.

It is the smallest useful version of the app that solves the core problem.

For this project, MVP means building the first working kiosk ordering flow without trying to ship every future idea at once.

### Personas

Personas are simplified user types that help define who the app is for.

In this project:

- `Kiosk Customer`
- `Restaurant Admin`

Personas help guide feature decisions, UX decisions, and priorities.

### User Journeys

User journeys describe the step-by-step path a user takes through the app.

Example from this project:

1. Customer browses the menu
2. Customer searches or filters by category
3. Customer adds items to basket
4. Customer reviews the summary
5. Customer checks out
6. Payment is confirmed by the backend
7. Order appears in admin management

User journeys help define requirements before coding starts.
