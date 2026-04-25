from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class ScamCase(Base):
    __tablename__ = "scam_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, nullable=False, unique=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    status = Column(String, nullable=False, default="New")
    urgency = Column(String, nullable=False)
    urgency_score = Column(Integer, nullable=False)
    scam_type = Column(String, nullable=False)

    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)

    customer_identifier = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    age_band = Column(String, nullable=False)
    vulnerable_adult_flag = Column(Boolean, nullable=False, default=False)

    source_unit = Column(String, nullable=False, default="Branch")

    assigned_owner = Column(String, nullable=True)
    assigned_team = Column(String, nullable=True)

    trusted_contact_exists = Column(Boolean, nullable=False, default=False)
    trusted_contact_name = Column(String, nullable=True)
    trusted_contact_phone = Column(String, nullable=True)

    intake_channel = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)
    amount_at_risk = Column(Float, nullable=False, default=0)

    money_already_left = Column(Boolean, nullable=False, default=False)
    customer_currently_on_call_with_scammer = Column(Boolean, nullable=False, default=False)
    new_payee_or_destination = Column(Boolean, nullable=False, default=False)
    customer_told_to_keep_secret = Column(Boolean, nullable=False, default=False)

    narrative = Column(Text, nullable=False)

    risk_factors_json = Column(Text, nullable=False)
    urgency_reasons_json = Column(Text, nullable=False)
    playbook_json = Column(Text, nullable=False)

    notes = Column(Text, nullable=False, default="")
    outcome_type = Column(String, nullable=True)
    closure_notes = Column(Text, nullable=True)
    closure_summary = Column(Text, nullable=True)
    estimated_amount_protected = Column(Float, nullable=True)
    estimated_amount_lost = Column(Float, nullable=True)
    trusted_contact_engaged = Column(Boolean, nullable=True)
    fraud_ops_involved = Column(Boolean, nullable=True)
    follow_up_required = Column(Boolean, nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
