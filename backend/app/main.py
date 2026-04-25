import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.scam_cases import router as scam_cases_router
from app.core.database import Base, engine, ensure_case_closure_columns
from app.models import action_log, scam_case  # noqa: F401

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

Base.metadata.create_all(bind=engine)
ensure_case_closure_columns()

app.include_router(health_router)
app.include_router(scam_cases_router)
