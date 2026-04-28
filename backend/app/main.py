import os

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.audit import router as audit_router
from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.scam_cases import router as scam_cases_router
from app.core.auth import validate_csrf_request, seed_demo_users
from app.core.database import Base, SessionLocal, engine, ensure_audit_actor_columns, ensure_case_closure_columns
from app.core.security import security_headers_for_path
from app.models import action_log, scam_case, system_audit_log, user  # noqa: F401

app = FastAPI(
    title="Aegis Member Protection API",
    description=(
        "Backend API for intake, queue operations, case updates, "
        "and reporting for suspected elder exploitation workflows."
    ),
    version="0.1.0",
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    try:
        validate_csrf_request(request)
    except Exception as exc:
        if isinstance(exc, HTTPException):
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)
        raise

    response = await call_next(request)
    for header, value in security_headers_for_path(request.url.path).items():
        response.headers.setdefault(header, value)
    return response

Base.metadata.create_all(bind=engine)
ensure_case_closure_columns()
ensure_audit_actor_columns()
seed_db = SessionLocal()
try:
    seed_demo_users(seed_db)
finally:
    seed_db.close()

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(audit_router)
app.include_router(scam_cases_router)
