# GitHub Actions, CI/CD, and Pull Requests

This note explains how GitHub Actions and pull requests work in this project.

## 1. What GitHub Actions Is

GitHub Actions is GitHub's automation system.

It can automatically run tasks when something happens in the repository, for example:

- pushing code
- opening a pull request
- merging into `main`

Those automated tasks are called **workflows**.

In this project, the workflow file is:

```txt
.github/workflows/ci.yml
```

## 2. What CI/CD Means

### CI

`CI` means `Continuous Integration`.

It means:

- developers push code often
- the project automatically checks that code
- problems are found early

Typical CI checks are:

- install dependencies
- lint
- typecheck
- test
- build

### CD

`CD` usually means one of these:

- `Continuous Delivery`
- `Continuous Deployment`

That is the part where code is prepared for release or deployed automatically.

## 3. What This Project Has Right Now

Right now, this repository has **CI**, not full CD.

Current workflow:

- file: `.github/workflows/ci.yml`
- trigger on pull requests to `main`
- trigger on pushes to `main`

Jobs in the workflow:

- `lint`
- `typecheck`
- `test`
- `build`

Each job:

1. checks out the code
2. installs `pnpm`
3. installs Node.js
4. installs dependencies
5. runs one project command

## 4. How GitHub Actions Works In This Repo

This workflow runs when:

- you open or update a pull request targeting `main`
- you push directly to `main`

The workflow uses this structure:

```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
```

That means:

- branch work is checked before merge through pull requests
- `main` is checked again after a direct push or merge

## 5. What The CI Jobs Actually Check

### `pnpm lint`

Checks code quality rules.

### `pnpm typecheck`

Checks TypeScript types.

### `pnpm test`

Runs automated tests.

### `pnpm build`

Checks whether the apps/packages can build successfully.

## 6. How To Use CI At The Beginning Of A Project

At the beginning of a project, CI should be simple and strict.

Recommended use:

1. create a feature branch
2. make a small change
3. run basic checks locally if possible
4. push the branch
5. open a pull request
6. wait for GitHub Actions to run
7. fix any failing checks
8. merge only when CI is green

For this project, that usually means:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI should be added early because it prevents the main branch from drifting into a broken state.

## 7. What A Pull Request Is

A pull request, or `PR`, is a proposed set of changes from one branch into another branch.

Example:

- source branch: `docs/product-discovery`
- target branch: `main`

A PR is used to:

- review changes
- discuss them
- run GitHub Actions checks
- merge safely into the target branch

## 8. How Pull Requests Work In Practice

Typical flow:

1. create a branch
2. make changes
3. commit changes
4. push the branch
5. open a PR on GitHub
6. fill in the PR template
7. wait for CI
8. merge when approved and green

Example local commands:

```powershell
git checkout -b docs/example-change
git add .
git commit -m "docs: update example"
git push -u origin docs/example-change
```

Then open GitHub and create a PR into `main`.

## 9. What The PR Template Does

This project has:

```txt
.github/pull_request_template.md
```

That file automatically fills the PR description with sections like:

- Summary
- Changes
- Testing
- Notes

It helps keep pull requests consistent.

## 10. How PRs and GitHub Actions Work Together

When you open a PR to `main`:

1. GitHub detects the PR event
2. GitHub Actions starts the `CI` workflow
3. Jobs run on GitHub's servers
4. Each job reports success or failure
5. You review the result in the PR page

If one job fails:

- the PR is still open
- you fix the code on the same branch
- you push again
- GitHub reruns the workflow

## 11. What "Green CI" Means

"Green CI" means all required checks passed.

In this repo, that means:

- lint passed
- typecheck passed
- test passed
- build passed

If one fails, the PR is not ready to merge.

## 12. Good Workflow For This Project

Use this workflow:

1. create a branch from `main`
2. make changes
3. run local checks when possible
4. push the branch
5. open PR to `main`
6. fix CI failures
7. merge into `main`

This keeps:

- `main` stable
- history cleaner
- problems visible earlier

## 13. What To Add Later For Full CD

Later, this project can extend GitHub Actions with:

- deployment workflows
- staging environment deploys
- production deploys
- Prisma migration jobs
- Docker image builds
- preview environments

That would move the repo from mostly CI to fuller CI/CD.
