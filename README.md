# Aegis Member Protection

Aegis Member Protection is a case operations platform for suspected elder exploitation workflows at credit unions.

It gives teams a structured way to intake concerns, triage risk, escalate cases, document actions, and review outcomes across branch, contact center, and fraud operations.

## Product Preview

![Aegis Homepage](docs/screenshots/homepage.png)

## Demo

![Aegis Demo](docs/demo/aegis-demo.gif)

---

## Why Aegis Exists

Suspected elder exploitation cases often begin in fragmented channels:

- a teller notices unusual behavior in a branch
- a contact center agent hears pressure or coaching language on a call
- digital activity changes after contact or device updates
- fraud or risk teams receive partial context too late

Most institutions do not have a dedicated workflow for these cases.  
They rely on email, spreadsheets, scattered notes, or generic case tools that were not designed for this operational problem.

Aegis is built to provide a clearer operating model from first concern to final resolution.

---

## What the Product Does

Aegis helps teams:

- capture concerns through structured intake
- route cases into a centralized operations workspace
- review urgency, ownership, and next steps
- document case activity and recommended actions
- monitor source-unit distribution and workflow outcomes through reporting

The goal is not just case storage.  
The goal is a more consistent and usable workflow for member protection operations.

---

## Core Product Areas

### Operations Workspace

A queue-driven operator workspace for reviewing active cases, updating status, escalating, assigning ownership, and tracking recent activity.

### Focused Case View

A selected-case panel that shows case summary, recommendations, next steps, and timeline context in one place.

### Structured Intake

A guided intake flow for capturing member context, suspicious activity, observed behavior, and risk indicators in a consistent format.

### Reporting

A management reporting layer for reviewing case volume, source-unit distribution, workflow progression, and operational outcomes.

---

## Who It Is For

Aegis is designed for financial institutions that need stronger operational workflows around suspected elder exploitation and related member protection concerns.

Primary users include:

- branch operations
- contact center teams
- fraud operations
- member protection teams
- supervisors and operational leaders

---

## Product Direction

This is an early-stage startup product focused on workflow clarity, operator usability, and case management structure.

The product is being shaped around a simple idea:

> high-risk member protection cases need a dedicated workflow, not a patchwork of generic tools

Current priorities are:

- improving operator speed and consistency
- creating better visibility across source units
- making reporting more useful for management review
- refining the product into a polished, pitch-ready internal tool

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript

### Backend

- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic

---

## Repository Structure

```text
aegis-member-protection/
├── backend/        # FastAPI backend
├── frontend/       # Next.js frontend
├── docs/           # Supporting project docs
├── legacy/         # Archived prototype files kept for reference
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have:

- Python 3
- Node.js
- npm
- Docker Desktop, if using Docker Compose

---

## Run Everything With Docker Compose

The production-engineering local stack includes the frontend, backend, and Postgres:

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment variables, SQLite/Postgres behavior, and troubleshooting.

---

## Run the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend docs should be available at: `http://localhost:8000/docs`

---

## Run the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend should be available at: `http://localhost:3000`

If you run the backend on a different port, set `NEXT_PUBLIC_API_BASE_URL` and `INTERNAL_API_BASE_URL` in `frontend/.env.local`.

---

## Environment and Persistence

The backend uses SQLite by default when `DATABASE_URL` is not set:

```text
sqlite:///./startup_scam_ops.db
```

Set `DATABASE_URL` to use Postgres, for example:

```text
postgresql+psycopg://aegis:aegis_password@db:5432/aegis
```

Environment examples are provided in:

- `.env.example`
- `backend/.env.example`
- `frontend/.env.example`

Do not commit real local `.env` files.

Auth/session environment variables:

```text
JWT_SECRET=replace-with-a-long-random-local-secret
SESSION_COOKIE_NAME=aegis_session
CSRF_COOKIE_NAME=aegis_csrf
ACCESS_TOKEN_EXPIRE_MINUTES=480
AUTH_DEMO_USERS_ENABLED=true
SESSION_COOKIE_SECURE=false
```

Aegis Assist environment variables:

```text
AI_ASSIST_ENABLED=true
AI_PROVIDER=mock
AI_API_KEY=
AI_MODEL=aegis-mock-assist
AI_REQUEST_TIMEOUT_SECONDS=15
```

Mock mode is deterministic and works without an external API key. Assist outputs are draft-only and never close, escalate, assign, update risk, or submit outcomes automatically.

Local demo users:

| Role | Email | Password |
| --- | --- | --- |
| Branch user | `branch@aegis.local` | `AegisBranch123!` |
| Fraud analyst | `fraud@aegis.local` | `AegisFraud123!` |
| Manager | `manager@aegis.local` | `AegisManager123!` |
| Admin | `admin@aegis.local` | `AegisAdmin123!` |

Unsafe authenticated API requests use CSRF protection. The frontend fetch helper calls `GET /api/auth/csrf` and sends `X-CSRF-Token` automatically.

For Docker Compose, the frontend uses separate backend URLs:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
INTERNAL_API_BASE_URL=http://backend:8000
```

The first URL is for the browser on your host machine. The second URL is for the frontend container and Next.js server-side rewrites.

---

## Checks

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
pytest
```

---

## Example Workflow

A typical product flow looks like this:

1. A concern is entered through structured intake
2. The case appears in the operations workspace
3. An operator reviews urgency, source unit, and ownership
4. The case is escalated, assigned, documented, or reviewed
5. Management can review outcomes and workflow patterns in reporting

---

## What This Project Demonstrates

This project demonstrates:

- full-stack product development
- internal-tool UX for operational teams
- workflow design for case handling
- structured intake and triage patterns
- management visibility through reporting
- product thinking around a real financial-services workflow problem

---

## Current Status

Aegis is currently an early product prototype focused on:

- workflow structure
- usability
- polish
- realistic internal-tool design
- startup presentation readiness

It is not positioned as a finished production platform yet.  
The current version is intended to demonstrate the product direction clearly and credibly.

---

## Future Enhancements

Planned improvements include:

- authentication and role-based access control
- configurable escalation logic
- richer notes, attachments, and collaboration history
- integrations with internal fraud, CRM, or case systems
- exportable reporting and audit history
- improved analytics and operational alerts
- production deployment hardening

---

## Screenshots

### Operations Workspace
Review active cases, assess urgency, escalate, assign ownership, and document next steps from one operator workspace.

![Operations Workspace](docs/screenshots/operations.png)

### Reporting
Track case volume, source-unit distribution, workflow progression, and operational outcomes in one management view.

![Reporting View](docs/screenshots/reporting.png)

### New Intake
Capture suspected exploitation concerns through a structured intake workflow with live triage guidance.

![New Intake](docs/screenshots/intake.png)

---

## Startup Framing

Aegis is being developed as a startup-style product, not just a technical demo.

The focus is on building a workflow system that feels:

- credible
- operational
- polished
- easy to explain
- ready for customer conversations and early pilots

---

## Authors

Built by Omer Kurt
