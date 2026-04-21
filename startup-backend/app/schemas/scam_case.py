from typing import Any, Literal, Optional

from pydantic import BaseModel


AgeBand = Literal["under_60", "60_69", "70_79", "80_plus", "unknown"]
IntakeChannel = Literal["branch", "phone", "family_report", "advisor_report", "online", "other"]
TransactionType = Literal["wire", "ach", "cash_withdrawal", "check", "card", "crypto", "gift_cards", "other"]
StatusType = Literal["New", "In Review", "Escalated", "Closed"]
OutcomeType = Literal["customer_protected", "funds_blocked", "funds_lost", "false_alarm", "follow_up_required", "unknown"]


class ScamCaseIntakeRequest(BaseModel):
    customer_identifier: str
    full_name: Optional[str] = None
    age_band: AgeBand
    vulnerable_adult_flag: bool = False

    source_unit: str = "Branch"

    trusted_contact_exists: bool = False
    trusted_contact_name: Optional[str] = None
    trusted_contact_phone: Optional[str] = None

    intake_channel: IntakeChannel
    transaction_type: TransactionType
    amount_at_risk: float = 0

    money_already_left: bool = False
    customer_currently_on_call_with_scammer: bool = False
    new_payee_or_destination: bool = False
    customer_told_to_keep_secret: bool = False

    narrative: str

    phone_based_imposter_story: bool = False
    government_or_bank_brand_impersonation: bool = False
    fear_or_urgency_language: bool = False
    secrecy_pressure: bool = False
    high_dollar_amount: bool = False
    older_or_vulnerable_customer: bool = False
    repeat_attempt: bool = False
    remote_access_or_tech_support_story: bool = False
    crypto_or_gift_card_request: bool = False
    romance_or_emotional_dependency_pattern: bool = False


class CaseStatusUpdate(BaseModel):
    status: StatusType


class CaseNotesUpdate(BaseModel):
    notes: str = ""


class CaseAssignmentUpdate(BaseModel):
    assigned_owner: Optional[str] = None
    assigned_team: Optional[str] = None


class CaseCloseUpdate(BaseModel):
    outcome_type: OutcomeType
    closure_notes: str


class ActionLogResponse(BaseModel):
    id: int
    created_at: Optional[str] = None
    action_type: str
    details: str


class ScamCaseResponse(BaseModel):
    id: int
    case_id: str

    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    status: str
    urgency: str
    urgency_score: int
    scam_type: str

    title: str
    summary: str

    customer_identifier: str
    full_name: Optional[str] = None
    age_band: str
    vulnerable_adult_flag: bool

    source_unit: str
    assigned_owner: Optional[str] = None
    assigned_team: Optional[str] = None

    trusted_contact_exists: bool
    trusted_contact_name: Optional[str] = None
    trusted_contact_phone: Optional[str] = None

    intake_channel: str
    transaction_type: str
    amount_at_risk: float

    money_already_left: bool
    customer_currently_on_call_with_scammer: bool
    new_payee_or_destination: bool
    customer_told_to_keep_secret: bool

    narrative: str

    urgency_reasons: list[str]
    risk_factors: dict[str, bool]
    playbook: dict[str, Any]

    notes: str
    outcome_type: Optional[str] = None
    closure_notes: Optional[str] = None

    action_logs: list[ActionLogResponse]
