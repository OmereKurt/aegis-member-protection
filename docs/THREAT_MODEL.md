# Aegis Threat Model

This document captures the Phase 3 security foundation for Aegis Member Protection. The current implementation includes local/demo authentication and RBAC enforcement, while intentionally deferring enterprise SSO and tenant complexity.

## Assets

- Member protection case records
- Intake narratives and operator notes
- Structured risk signals and case intelligence
- Action history and closure/outcome records
- Reporting metrics and operational summaries
- Demo/admin utilities that can reset or seed case data
- Database credentials and deployment environment variables

## Users and Roles

Current role concepts:

- `branch_user`: creates structured intake records and can view cases for demo continuity
- `fraud_analyst`: updates, investigates, completes playbook actions, and closes cases
- `manager`: views cases and management reporting; case mutation is restricted
- `admin`: full access, including demo seed/reset/delete utilities

The local/demo auth system seeds deterministic users when `AUTH_DEMO_USERS_ENABLED=true`.

## Trust Boundaries

- Browser to Next.js frontend
- Next.js frontend to FastAPI backend
- FastAPI backend to SQLite or Postgres
- Docker internal network between frontend, backend, and database
- Host machine to Docker-exposed ports
- CI runner to dependency registries and test runtime

## Key Threats

- Unauthorized case access or case mutation
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
- HttpOnly cookie-based JWT sessions signed with `JWT_SECRET`.
- PBKDF2 password hashing with per-user salts.
- Backend RBAC enforcement for protected case, reporting, mutation, closure, and demo-admin endpoints.
- Frontend route protection and role-aware action visibility.
- Shared RBAC constants/helpers in backend and frontend.
- Docker environment separation:
  - browser-facing `NEXT_PUBLIC_API_BASE_URL`
  - container/server-facing `INTERNAL_API_BASE_URL`
- `.env` files and local database files ignored by git.
- Backend tests covering auth success/failure, current user, protected endpoint access, role restrictions, case creation, demo seeding, validation, security headers, rate limiter behavior, and RBAC helpers.

## Assumptions

- Aegis is still a local/demo product and is not intended to handle real member data yet.
- Demo users are local-only and should be disabled or replaced before any real deployment.
- No production identity provider, SSO, MFA, password reset, or tenant model is connected yet.
- Docker Compose is for local development, not production hosting.
- The in-memory rate limiter is a foundation control only; it is not distributed across multiple backend instances.
- Demo/reset utilities remain available because they are useful for founder demos and local evaluation.

## Planned Controls

- Enterprise SSO/OIDC integration.
- MFA and production password/account lifecycle controls if local users remain supported.
- Tenant and institution isolation.
- Persistent/distributed rate limiting for deployed environments.
- Structured audit log viewer and export path.
- Database migrations with Alembic.
- Secrets management for deployed environments.
- TLS termination and production CORS allowlist.
- CSRF strategy review for cookie-authenticated write operations before production exposure.
- More complete dependency scanning and container scanning in CI.

## Future Security Test Cases

- SSO-authenticated users map to Aegis roles correctly.
- Expired sessions are rejected and refreshed only through an approved flow.
- Admin-only utilities remain inaccessible to non-admin roles.
- Case mutation attempts from read-only roles remain blocked at the backend.
