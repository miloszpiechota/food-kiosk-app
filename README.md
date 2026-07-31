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
- Admin auth backend with first super-admin setup, password login, required TOTP challenge, password reset, logout, and session guards
- Admin panel frontend with login, QR/manual TOTP setup for first super-admin setup, invite confirmation, password reset, temporary dev bypass, and menu visibility save/reset controls
- Restaurant-scoped admin user and menu-product endpoints
- Backend-backed admin order search, filters, details, and status updates
- Kiosk meal filtering when required meal groups have no visible options
- Accessibility-oriented kiosk UI foundations
- Automated tests and CI foundation
- Dockerized local PostgreSQL setup

## Planned Core Features

- Production email provider for admin invites and password reset
- Production-grade password hashing migration from the current Node `crypto.pbkdf2` implementation
- Rate limiting and audit logging for admin auth
- Accessibility settings
- Remove temporary admin-panel bypass before production use
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
