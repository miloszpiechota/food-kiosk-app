# Food Ordering Kiosk App

Production-style full-stack food ordering kiosk app built with React, TypeScript, NestJS, PostgreSQL, Stripe test payments, CI/CD, accessibility, security, and automated testing.

## Status

Customer kiosk MVP flow implemented through Stripe test checkout. Multi-restaurant admin authentication, admin order management, deployment, and final portfolio polish remain in progress.

## Implemented Core Features

- Kiosk ordering flow
- Product categories and menu browsing
- Cart and checkout
- Stripe test payments
- Verified Stripe webhook payment confirmation
- Backend basket and order snapshots
- Meal builder and product personalization
- Accessibility-oriented kiosk UI foundations
- Automated tests and CI foundation
- Dockerized local PostgreSQL setup

## Planned Core Features

- Admin dashboard
- Multi-restaurant admin access
- Super-admin invite links
- Mandatory two-factor authentication
- Order status management
- Admin order search and detail views
- Menu product hide/unhide controls
- Accessibility settings
- Security-focused admin area
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
