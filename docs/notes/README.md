# Notes

This directory stores practical project notes that do not belong in product, architecture, testing, or deployment documentation.

## Structure

- `issues/`
  - Known problems, root causes, fixes, and verification steps
  - `prisma-client-typescript-and-tooling-issues.md`
    - Prisma Client, TypeScript, Jest, pnpm install, and API build troubleshooting
- `project-basics.md`
  - Beginner-friendly explanations of core project and workflow concepts
- `ci-cd-and-pull-requests.md`
  - Beginner-friendly explanation of GitHub Actions, CI/CD, and PR workflow
- `github-security-and-branch-protection.md`
  - Practical recommendations for branch protection, GitHub security settings, and CI hardening

## Useful Project Notes

### Windows Shell Note

On this machine, `pnpm` may fail in PowerShell because script execution is blocked. In that case, use:

```powershell
pnpm.cmd <command>
```

Example:

```powershell
pnpm.cmd test
```

### Environment Files

- Root `.env` is used for application runtime settings
- `packages/database/.env` is currently required for Prisma CLI commands run from the database package

### Local Database

Start PostgreSQL with:

```powershell
pnpm db:up
```

Check status with:

```powershell
pnpm db:ps
```

### CI Quality Gates

The main CI workflow is expected to run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Issue Note Format

When adding a new issue note, prefer this structure:

1. Summary
2. What caused the issue
3. How to solve it
4. Why the fix works
5. Verification
