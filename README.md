# Food Ordering Kiosk App

Production-style full-stack food ordering kiosk app built with React, TypeScript, NestJS, PostgreSQL, Stripe test payments, CI/CD, accessibility, security, and automated testing.

## Status

Customer kiosk MVP flow implemented through Stripe test checkout. Admin authentication, first super-admin setup, invites, restaurant scoping, menu visibility controls, and backend-backed admin order management are in progress. Deployment and final portfolio polish remain incomplete.

## Implemented Core Features

- Kiosk ordering flow
- Product categories and menu browsing
- Cart and checkout
- Stripe test payments
- Verified Stripe webhook payment confirmation
- Backend basket and order snapshots
- Meal builder and product personalization
- Admin auth backend with first super-admin setup, invite-based worker password/2FA enrollment, password login, required TOTP challenge, recovery codes, password reset, rate limiting, audit logs, logout, and session guards
- Memory-hard `scrypt` admin password hashing with legacy PBKDF2 verification for existing hashes
- Admin panel frontend with login, QR/manual TOTP setup for first super-admin and invited admins, password reset, recovery-code regeneration, dev-only opt-in bypass, and menu visibility save/reset controls
- Resend-backed production email delivery option for admin invites and password reset, with console delivery for local development
- Restaurant-scoped admin user and menu-product endpoints
- Backend-backed admin order search, filters, details, and status updates
- Kiosk meal filtering when required meal groups have no visible options
- Accessibility-oriented kiosk UI foundations
- Automated tests and CI foundation
- Dockerized local PostgreSQL setup

## Planned Core Features

- Optional Argon2 password hashing swap if native dependencies are approved for the deployment environment
- Accessibility settings
- Remove temporary admin-panel bypass code during final production polish
- Dev, staging, and production environments

## Project Structure

```txt
apps/web      React frontend
apps/api      NestJS backend
packages/*    shared packages
docs/*        product, architecture, testing, deployment docs
backlog/*     epics and user stories
.ai/*         AI agent instructions and prompts
```
