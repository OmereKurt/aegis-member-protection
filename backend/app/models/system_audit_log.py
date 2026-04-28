from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    action_type = Column(String, nullable=False, index=True)
    details = Column(Text, nullable=False)
    actor_email = Column(String, nullable=True)
    actor_role = Column(String, nullable=True)
    resource_type = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
