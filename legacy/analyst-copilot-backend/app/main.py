from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.alerts import router as alerts_router
from app.api.routes.cases import router as cases_router
from app.api.routes.health import router as health_router
from app.core.database import Base, engine

app = FastAPI(title="Analyst Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(health_router)
app.include_router(alerts_router)
app.include_router(cases_router)
