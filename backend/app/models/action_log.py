from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, index=True)
    scam_case_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    action_type = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    actor_email = Column(String, nullable=True)
    actor_role = Column(String, nullable=True)
