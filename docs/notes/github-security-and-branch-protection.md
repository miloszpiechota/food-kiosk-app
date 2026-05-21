# GitHub Security, Branch Protection, and Better CI

This note explains how to use GitHub security features and how to improve CI for this project.

## 1. Best Solo-Developer Branch Protection Setup

If you work alone, protect `main`, but do not require another reviewer.

Recommended `main` rules:

- Require a pull request before merging: `ON`
- Require approvals: `OFF`
- Require status checks to pass before merging: `ON`
- Require branches to be up to date before merging: `ON`
- Require conversation resolution before merging: `ON` if you want stricter PR hygiene
- Allow force pushes: `OFF`
- Allow deletions: `OFF`

### Status Checks To Require

Use your existing CI jobs:

- `lint`
- `typecheck`
- `test`
- `build`

Later you can also require:

- `security`
- `dependency-review`
- `codeql`

## 2. Repository Rules / Rulesets

GitHub Repository Rules let you define protection rules for important branches like `main`.

For this project, use a ruleset for:

- `main`

Good rules for a solo portfolio repository:

- pull request required
- status checks required
- branch must be up to date
- no force push
- no delete

### About Signed Commits

Signed commits improve authenticity because GitHub can verify that a commit was signed by your key.

Use them if:

- you want stronger commit authenticity
- you are comfortable setting up GPG or SSH signing

Do not force them yet if:

- you are still learning GitHub workflow
- you want lower friction while setting up the project

### About Linear History

Linear history means the branch history stays cleaner and avoids merge commits.

Use it if you want:

- cleaner commit history
- squash merge or rebase merge workflow

Do not require it if:

- you are still learning Git
- you want simpler merging for now

For this project, it is optional. A good beginner setup is:

- linear history: `OFF`
- squash merge: `ON`

## 3. Security Features To Enable In GitHub

In `Settings -> Security & analysis`, enable:

- Dependabot alerts
- Dependabot security updates
- Secret scanning
- Push protection for secrets, if available

These help catch:

- vulnerable dependencies
- accidentally committed secrets
- known security problems in packages

## 4. How To Use Secrets Safely

Do not put secrets in:

- source code
- committed `.env` files
- documentation with real values

Use:

- GitHub Actions secrets
- GitHub environment secrets

Examples for this project:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Keep only placeholders in `.env.example`.

## 5. Use GitHub Environments

Create environments like:

- `development`
- `staging`
- `production`

Why:

- separate secrets by environment
- safer future deployments
- optional approval gates before deployment

Even if you are not deploying yet, planning these environments early is useful.

## 6. How To Make GitHub Actions More Useful

Your current CI is a good start:

- lint
- typecheck
- test
- build

To make it more useful, improve it step by step.

### Add `concurrency`

This cancels old runs for the same branch or PR when a new push arrives.

Why:

- saves CI time
- reduces queue noise

### Add Minimal Permissions

At workflow level, set:

```yaml
permissions:
  contents: read
```

Why:

- least-privilege default
- safer than broad write permissions

### Add Timeouts

Use job timeouts so stuck jobs do not run forever.

Example:

```yaml
timeout-minutes: 10
```

### Add Security Workflows

Useful next workflows:

- `dependency-review`
- `CodeQL` code scanning
- optional `pnpm audit`

### Add Prisma Validation

Since this project uses Prisma, CI should also validate the schema.

Example command:

```powershell
pnpm --filter @food-kiosk/database prisma:validate
```

### Add Docker Checks Later

When Docker becomes part of the app runtime, add:

- Docker image build workflow
- optional Compose validation

## 7. Recommended Next GitHub Actions Improvements For This Repo

Best next upgrades:

1. Add workflow `permissions`
2. Add `concurrency`
3. Add a separate dependency-review workflow
4. Add a CodeQL workflow
5. Add Prisma validation into CI

That gives you:

- code quality checks
- type safety checks
- dependency risk checks
- basic code scanning
- database schema validation

## 8. Safe PR Workflow For This Project

Use this flow:

1. Create a branch from `main`
2. Make a small change
3. Commit and push
4. Open a pull request into `main`
5. Wait for CI to pass
6. Fix anything red
7. Merge only when checks are green

This gives you branch security even as a solo developer.

## 9. Practical Solo Recommendation

For this project right now, the best setup is:

- Require PRs into `main`
- Do not require approving reviews
- Require `lint`, `typecheck`, `test`, and `build`
- Block force pushes and deletes
- Enable Dependabot and secret scanning
- Add CodeQL and dependency review next
