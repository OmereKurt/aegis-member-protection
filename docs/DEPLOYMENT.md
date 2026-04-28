# Aegis Deployment and Local Development

This guide covers the current production-engineering setup for Aegis Member Protection.

The app can run in two modes:

- Manual local development with SQLite fallback
- Docker Compose local development with Postgres

## Services

| Service | Purpose | Default URL |
| --- | --- | --- |
| Frontend | Next.js app | `http://localhost:3000` |
| Backend | FastAPI API | `http://localhost:8000` |
| Backend docs | FastAPI OpenAPI docs | `http://localhost:8000/docs` |
| Postgres | Docker database | `localhost:5432` |

## Environment Variables

Backend:

| Variable | Purpose | Default behavior |
| --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy database URL | If unset, backend uses SQLite at `sqlite:///./startup_scam_ops.db` |
| `FRONTEND_URL` | CORS allowlist URL for the frontend | `http://localhost:3000` |
| `JWT_SECRET` | HMAC secret used to sign local JWT session cookies | Required outside throwaway local demos |
| `SESSION_COOKIE_NAME` | HttpOnly session cookie name | `aegis_session` |
| `CSRF_COOKIE_NAME` | Readable double-submit CSRF cookie name | `aegis_csrf` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Session lifetime in minutes | `480` |
| `AUTH_DEMO_USERS_ENABLED` | Seeds deterministic local demo users on startup | `true` |
| `SESSION_COOKIE_SECURE` | Sets the cookie `Secure` flag for HTTPS deployments | `false` locally |
| `AI_ASSIST_ENABLED` | Enables case-level Aegis Assist draft endpoints | `true` |
| `AI_PROVIDER` | Assist provider selector; `mock` is the safe local/demo mode | `mock` |
| `AI_API_KEY` | Optional provider key for future reviewed provider integrations | Empty in mock mode |
| `AI_MODEL` | Assist model identifier for future provider integrations | `aegis-mock-assist` |
| `AI_REQUEST_TIMEOUT_SECONDS` | Provider request timeout for future real integrations | `15` |
| `ENVIRONMENT` | Environment label for local/CI/Docker clarity | Optional |

Frontend:

| Variable | Purpose | Default behavior |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Browser-facing backend origin used by client-side calls | `http://localhost:8000` |
| `INTERNAL_API_BASE_URL` | Server/container-facing backend origin used by Next.js rewrites and server-side calls | Falls back to `NEXT_PUBLIC_API_BASE_URL` |

Docker Compose:

| Variable | Purpose | Default |
| --- | --- | --- |
| `POSTGRES_DB` | Postgres database name | `aegis` |
| `POSTGRES_USER` | Postgres username | `aegis` |
| `POSTGRES_PASSWORD` | Postgres password | `aegis_password` |
| `POSTGRES_PORT` | Host port for Postgres | `5432` |
| `BACKEND_PORT` | Host port for FastAPI | `8000` |
| `FRONTEND_PORT` | Host port for Next.js | `3000` |

Use `.env.example`, `backend/.env.example`, and `frontend/.env.example` as templates. Do not commit real `.env` files.

## Demo Users

Demo users are seeded idempotently when `AUTH_DEMO_USERS_ENABLED=true`.

| Role | Email | Password |
| --- | --- | --- |
| Branch user | `branch@aegis.local` | `AegisBranch123!` |
| Fraud analyst | `fraud@aegis.local` | `AegisFraud123!` |
| Manager | `manager@aegis.local` | `AegisManager123!` |
| Admin | `admin@aegis.local` | `AegisAdmin123!` |

These accounts are for local development and demos only.

Role summary:

- `branch_user`: create intake and view cases for demo continuity
- `fraud_analyst`: view cases, update cases, complete playbook actions, close cases, view reporting
- `manager`: view cases and reporting, read-only for case mutation
- `admin`: full access, including seed/reset/delete demo utilities

## Auth and CSRF Notes

Aegis uses an HttpOnly cookie JWT session for local/demo authentication. Because cookie sessions are automatically sent by the browser, unsafe API methods require a signed CSRF token:

- `GET /api/auth/csrf` issues a signed CSRF token bound to the current session.
- Frontend API helpers include `X-CSRF-Token` for `POST`, `PUT`, `PATCH`, and `DELETE`.
- `POST /api/auth/login` and `POST /api/auth/logout` are exempt so users can start/end sessions cleanly.

Keep `SESSION_COOKIE_SECURE=false` for local HTTP. Use `SESSION_COOKIE_SECURE=true` behind HTTPS.

Admin audit visibility:

- `GET /api/audit/system`
- Admin-only
- Returns recent system audit log entries for seed/reset/delete activity and actor attribution.

Aegis Assist:

- `POST /api/assist/case-summary`
- `POST /api/assist/operator-note`
- `POST /api/assist/playbook-explanation`

Assist endpoints require authentication, RBAC, and CSRF tokens because they are unsafe `POST` requests. Mock mode is deterministic and does not need `AI_API_KEY`. Assist outputs are drafts only; they do not change status, risk, owner, closure, or outcomes automatically.

## Manual Local Development

Use this when you want the simplest local workflow. If `DATABASE_URL` is not set, the backend uses SQLite.

Backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

If you run the backend on port `8001`, set this in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
INTERNAL_API_BASE_URL=http://localhost:8001
```

## Docker Compose Local Development

Run the full stack with Postgres:

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- Backend docs: `http://localhost:8000/docs`

The Compose backend uses:

```text
postgresql+psycopg://aegis:aegis_password@db:5432/aegis
```

In Docker Compose, the frontend uses two backend URLs:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
INTERNAL_API_BASE_URL=http://backend:8000
```

`NEXT_PUBLIC_API_BASE_URL` is correct for the browser on your host machine.
`INTERNAL_API_BASE_URL` is correct inside the frontend container, where `localhost` would otherwise point back to the frontend container itself.

The frontend API helper uses the browser-facing URL in the browser. Next.js rewrites and server-side/container calls use `INTERNAL_API_BASE_URL` when it is set.

Auth in Docker uses the same browser-facing backend URL, `http://localhost:8000`, so the HttpOnly session cookie is set for the host browser. Keep `SESSION_COOKIE_SECURE=false` for local HTTP Compose runs.

## Reset Docker Data

Postgres data is stored in the `postgres_data` Docker volume. To remove local Docker database state:

```bash
docker compose down -v
```

Then rebuild:

```bash
docker compose up --build
```

## Backend Tests

Backend tests use a temporary SQLite database and do not touch the developer database.

```bash
cd backend
pytest
```

Current coverage includes:

- health endpoint
- list cases endpoint
- create case endpoint
- seed demo data endpoint

## Frontend Checks

```bash
cd frontend
npm run lint
npm run build
```

## CI

GitHub Actions runs on push and pull request:

- frontend install
- frontend lint
- frontend build
- backend install
- backend tests

Workflow file:

```text
.github/workflows/ci.yml
```

## Troubleshooting

Backend unavailable in the UI:

- Confirm the backend is running on the browser-facing URL in `NEXT_PUBLIC_API_BASE_URL`.
- For manual local dev, verify `http://localhost:8000/health`.
- For Docker, verify `docker compose ps` and `http://localhost:8000/health`.
- If protected pages redirect to `/login`, sign in with one of the seeded demo users.

Postgres connection errors in Docker:

- Confirm the `db` service is healthy with `docker compose ps`.
- Run `docker compose down -v` if you want a clean local database.
- Check that `DATABASE_URL` points at `db:5432` from inside Compose, not `localhost:5432`.

Frontend cannot reach backend in Docker:

- Use `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` for browser/client calls.
- Use `INTERNAL_API_BASE_URL=http://backend:8000` for Next.js rewrites and container/server calls.
- Rebuild the frontend container after changing either value because Next.js uses them during build.

SQLite file confusion:

- If `DATABASE_URL` is unset, the backend writes `startup_scam_ops.db` in the backend working directory.
- Set `DATABASE_URL` explicitly when you want Postgres or a different SQLite path.
