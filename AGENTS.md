# AGENTS.md

## Project
Food Ordering Kiosk App — production-style full-stack portfolio project.

## Main Goal
Build a production-ready, full-stack application using React, NestJS, and PostgreSQL. Features secure Stripe test payments, Docker containerization, robust CI/CD pipelines, and high accessibility. Designed with architecture best practices to ensure simplicity, scalability, and real-world utility.

## Architecture
- Frontend: apps/web
- Backend: apps/api
- Shared packages: packages/*
- Documentation: docs/*
- Backlog: backlog/*
- AI instructions: .ai/*

## Rules for AI Agents
- Do not commit secrets.
- Do not invent implemented features in documentation.
- Do not modify payment/security logic without adding tests.
- Prefer small pull requests.
- Keep README concise and recruiter-friendly.
- Put detailed documentation in docs/.
- Mark unfinished features as Planned, not Implemented.
- Use TypeScript strict style.
- Add or update tests when changing behavior.
- For accessibility, preserve keyboard navigation and visible focus states.
- For Stripe, use test mode only.
- Payment status must be confirmed through verified webhook, not only frontend redirect.

## Commands
Use these commands before proposing a completed change:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation Rules
- Product docs live in `docs/product`.
- Architecture docs live in `docs/architecture`.
- ADRs live in `docs/adr`.
- Testing docs live in `docs/testing`.
- Deployment docs live in `docs/deployment`.
- Mermaid diagrams are preferred for GitHub readability.

## Branch Naming
- `feature/*`
- `fix/*`
- `docs/*`
- `chore/*`
- `test/*`
