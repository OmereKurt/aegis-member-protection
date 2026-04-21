from sqlalchemy import Column, Integer, String, Text
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
    summary = Column(Text, nullable=False)
    recommended_actions_json = Column(Text, nullable=False)
    normalized_alert_json = Column(Text, nullable=False)
    enrichment_json = Column(Text, nullable=False)
