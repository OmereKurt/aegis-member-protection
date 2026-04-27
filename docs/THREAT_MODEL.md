# Aegis Threat Model

This document captures the Phase 3A security foundation for Aegis Member Protection. It is intentionally practical and scoped to the current product: no full authentication has been added yet.

## Assets

- Member protection case records
- Intake narratives and operator notes
- Structured risk signals and case intelligence
- Action history and closure/outcome records
- Reporting metrics and operational summaries
- Demo/admin utilities that can reset or seed case data
- Database credentials and deployment environment variables

## Users and Future Roles

Planned role concepts:

- `branch_user`: creates structured intake records
- `fraud_analyst`: updates, investigates, and closes cases
- `manager`: views reporting and operational analytics
- `admin`: manages demo/admin utilities and future system settings

Current implementation includes shared role and permission constants, but does not enforce authentication or authorization yet.

## Trust Boundaries

- Browser to Next.js frontend
- Next.js frontend to FastAPI backend
- FastAPI backend to SQLite or Postgres
- Docker internal network between frontend, backend, and database
- Host machine to Docker-exposed ports
- CI runner to dependency registries and test runtime

## Key Threats

- Unauthorized case access before authentication exists
- Accidental destructive use of reset/seed/delete utilities
- Write endpoint abuse or automated request bursts
- Injection through free-text intake, notes, and closure fields
- Sensitive data exposure through browser framing, MIME sniffing, or overly permissive headers
- Weak environment separation causing frontend containers to call the wrong backend URL
- Audit gaps for state-changing or destructive operations
- Local `.env` or database files accidentally committed

## Current Controls

- Security headers on backend responses:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Content-Security-Policy`
  - `Permissions-Policy`
- Lightweight in-memory rate limiting on write/admin endpoints:
  - create case
  - update status, assignment, notes, and structured actions
  - close case
  - delete case
  - reset demo data
  - seed demo data
- Pydantic validation for:
  - nonnegative/capped amounts
  - enum status/outcome fields
  - required intake and closure fields
  - text length limits
  - trimmed text inputs
- Case-level action logs for meaningful case changes.
- System audit log table for destructive/admin operations that are not tied to a durable case after deletion/reset.
- RBAC scaffolding in backend and frontend constants/helpers.
- Docker environment separation:
  - browser-facing `NEXT_PUBLIC_API_BASE_URL`
  - container/server-facing `INTERNAL_API_BASE_URL`
- `.env` files and local database files ignored by git.
- Backend tests covering health, case creation, demo seeding, validation, security headers, rate limiter behavior, and RBAC scaffolding.

## Assumptions

- Aegis is still a local/demo product and is not handling real member data.
- No production identity provider is connected yet.
- Docker Compose is for local development, not production hosting.
- The in-memory rate limiter is a foundation control only; it is not distributed across multiple backend instances.
- Demo/reset utilities remain available because they are useful for founder demos and local evaluation.

## Planned Controls

- Full authentication with an enterprise identity provider or secure session model.
- Enforced backend authorization based on authenticated user role.
- Protected admin utilities for reset/seed/delete.
- Persistent/distributed rate limiting for deployed environments.
- Structured audit log viewer and export path.
- Database migrations with Alembic.
- Secrets management for deployed environments.
- TLS termination and production CORS allowlist.
- More complete dependency scanning and container scanning in CI.

## Future Security Test Cases

- `branch_user` can create intake but cannot close cases or reset demo data.
- `fraud_analyst` can update/close cases but cannot reset demo data.
- `manager` can view reporting but cannot mutate cases by default.
- `admin` can use demo/reset utilities.
- Unauthorized requests to protected routes are rejected once authentication exists.
