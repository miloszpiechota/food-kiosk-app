# GitHub Actions Web Test Failure: `vitest` Not Found

## Summary

The `test` job in GitHub Actions failed while running:

```powershell
pnpm test
```

The relevant error was:

```txt
apps/web test: sh: 1: vitest: not found
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL @food-kiosk/web@0.0.0 test: `vitest run`
```

## What Caused The Issue

The web app already had this script in `apps/web/package.json`:

```json
"test": "vitest run"
```

But `vitest` was not installed in `apps/web/devDependencies`.

That made the CI runner fail as soon as the workspace test command reached `apps/web`.

## How To Solve It

Update `apps/web/package.json`:

1. Add `vitest` to `devDependencies`
2. Change the test script to allow an empty test suite during early setup

Resulting script:

```json
"test": "vitest run --passWithNoTests"
```

Then update the lockfile and push both files:

```powershell
git add apps/web/package.json pnpm-lock.yaml
git commit -m "test: add vitest to web app"
git push
```

## Why This Fix Works

- GitHub Actions can install `vitest` for the web package
- The workspace `pnpm test` command no longer fails just because the frontend has no tests yet
- CI stays ready for future Vitest-based frontend tests

## Verification

After pushing the fix:

1. Re-run the failed GitHub Actions workflow
2. Open the `test` job
3. Confirm that the web package no longer fails with `vitest: not found`

## Notes

- This fixes the CI configuration issue, not every local Windows test/runtime issue
- Local `spawn EPERM` errors seen on Windows are a separate environment problem
