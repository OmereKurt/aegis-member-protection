import os

from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./startup_scam_ops.db")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine_kwargs = {
    "pool_pre_ping": True,
}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_case_closure_columns():
    inspector = inspect(engine)
    if "scam_cases" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("scam_cases")}
    closure_columns = {
        "closure_summary": "TEXT",
        "estimated_amount_protected": "FLOAT",
        "estimated_amount_lost": "FLOAT",
        "trusted_contact_engaged": "BOOLEAN",
        "fraud_ops_involved": "BOOLEAN",
        "follow_up_required": "BOOLEAN",
        "closed_at": "DATETIME",
    }

    with engine.begin() as connection:
        for column_name, column_type in closure_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE scam_cases ADD COLUMN {column_name} {column_type}"))
