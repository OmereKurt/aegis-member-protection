from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="New")
    notes = Column(Text, nullable=False, default="")
    summary = Column(Text, nullable=False)
    reasons_json = Column(Text, nullable=False)
    recommended_actions_json = Column(Text, nullable=False)
    normalized_alert_json = Column(Text, nullable=False)
    enrichment_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
