from typing import Any, Literal, Optional

from pydantic import BaseModel, field_validator, model_validator


AgeBand = Literal["under_60", "60_69", "70_79", "80_plus", "unknown"]
IntakeChannel = Literal["branch", "phone", "family_report", "advisor_report", "online", "other"]
TransactionType = Literal["wire", "ach", "cash_withdrawal", "check", "card", "crypto", "gift_cards", "other"]
StatusType = Literal["New", "In Review", "Escalated", "Closed"]
OutcomeType = Literal[
    "member_protected",
    "funds_blocked_or_held",
    "trusted_contact_engaged",
    "fraud_ops_escalation_completed",
    "monitoring_only",
    "false_concern_no_exploitation_found",
    "funds_sent_loss_occurred",
    "customer_unreachable",
    "other",
    "customer_protected",
    "funds_blocked",
    "funds_lost",
    "false_alarm",
    "follow_up_required",
    "unknown",
]

MAX_TRACKED_AMOUNT = 1_000_000


def _first_present(data: dict, *keys: str):
    for key in keys:
        if key in data:
            return data[key]
    return None


def _normalize_age_band(value):
    if value is None:
        return "unknown"

    normalized = str(value).strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "under_60": "under_60",
        "60_69": "60_69",
        "70_79": "70_79",
        "80_89": "80_plus",
        "80_plus": "80_plus",
        "80+": "80_plus",
        "90+": "80_plus",
        "unknown": "unknown",
    }
    return aliases.get(normalized, "unknown")


def _normalize_intake_channel(value):
    if value is None:
        return "other"

    normalized = str(value).strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "branch": "branch",
        "phone": "phone",
        "call_center": "phone",
        "contact_center": "phone",
        "family_report": "family_report",
        "advisor_report": "advisor_report",
        "fraud_referral": "advisor_report",
        "digital": "online",
        "digital_banking": "online",
        "online": "online",
        "other": "other",
    }
    return aliases.get(normalized, "other")


def _normalize_transaction_type(value):
    if value is None:
        return "other"

    normalized = str(value).strip().lower().replace(" ", "_").replace("-", "_").replace("'", "")
    aliases = {
        "wire": "wire",
        "ach": "ach",
        "cash_withdrawal": "cash_withdrawal",
        "cashiers_check": "check",
        "cashier’s_check": "check",
        "check": "check",
        "card": "card",
        "card_activity": "card",
        "crypto": "crypto",
        "gift_cards": "gift_cards",
        "gift_card": "gift_cards",
        "other": "other",
    }
    return aliases.get(normalized, "other")


class ScamCaseIntakeRequest(BaseModel):

    @model_validator(mode="before")
    @classmethod
    def normalize_frontend_payload(cls, data):
        if not isinstance(data, dict):
            return data

        normalized = dict(data)

        normalized["customer_identifier"] = _first_present(normalized, "customer_identifier", "memberIdentifier")
        normalized["full_name"] = _first_present(normalized, "full_name", "memberName")
        normalized["age_band"] = _normalize_age_band(_first_present(normalized, "age_band", "ageBand"))
        normalized["vulnerable_adult_flag"] = bool(
            _first_present(normalized, "vulnerable_adult_flag", "potentiallyVulnerableAdult") or False
        )
        normalized["source_unit"] = _first_present(normalized, "source_unit", "sourceUnit") or "Branch"

        normalized["trusted_contact_exists"] = bool(
            _first_present(normalized, "trusted_contact_exists", "trustedContactAvailable") or False
        )
        normalized["trusted_contact_name"] = _first_present(normalized, "trusted_contact_name", "trustedContactName")
        normalized["trusted_contact_phone"] = _first_present(normalized, "trusted_contact_phone", "trustedContactPhone")

        normalized["intake_channel"] = _normalize_intake_channel(
            _first_present(normalized, "intake_channel", "intakeChannel")
        )
        normalized["transaction_type"] = _normalize_transaction_type(
            _first_present(normalized, "transaction_type", "transactionType")
        )

        amount = _first_present(normalized, "amount_at_risk", "potentialLossAmount")
        normalized["amount_at_risk"] = float(amount or 0)

        normalized["money_already_left"] = bool(
            _first_present(normalized, "money_already_left", "fundsMayHaveLeft") or False
        )
        normalized["customer_currently_on_call_with_scammer"] = bool(
            _first_present(
                normalized,
                "customer_currently_on_call_with_scammer",
                "memberStillOnPhoneWithScammer",
            )
            or False
        )
        normalized["new_payee_or_destination"] = bool(
            _first_present(normalized, "new_payee_or_destination", "newPayeeOrDestination") or False
        )
        normalized["customer_told_to_keep_secret"] = bool(
            _first_present(normalized, "customer_told_to_keep_secret", "toldToKeepSecret") or False
        )

        observations = str(_first_present(normalized, "staffObservations") or "").strip()
        operator_notes = str(_first_present(normalized, "operatorNotes") or "").strip()
        narrative = str(_first_present(normalized, "narrative") or "").strip()
        if not narrative:
            narrative = "\n\n".join(
                item
                for item in [
                    observations,
                    f"Operator notes: {operator_notes}" if operator_notes else "",
                ]
                if item
            )
        normalized["narrative"] = narrative or "No narrative provided."

        normalized["phone_based_imposter_story"] = bool(
            _first_present(normalized, "phone_based_imposter_story", "memberStillOnPhoneWithScammer") or False
        )
        normalized["government_or_bank_brand_impersonation"] = bool(
            _first_present(normalized, "government_or_bank_brand_impersonation", "coachedOrPressured") or False
        )
        normalized["fear_or_urgency_language"] = bool(
            _first_present(normalized, "fear_or_urgency_language", "coachedOrPressured") or False
        )
        normalized["secrecy_pressure"] = bool(
            _first_present(normalized, "secrecy_pressure", "toldToKeepSecret") or False
        )
        normalized["high_dollar_amount"] = bool(
            _first_present(normalized, "high_dollar_amount") or normalized["amount_at_risk"] >= 10000
        )
        normalized["older_or_vulnerable_customer"] = bool(
            _first_present(normalized, "older_or_vulnerable_customer", "potentiallyVulnerableAdult") or False
        )
        normalized["repeat_attempt"] = bool(
            _first_present(normalized, "repeat_attempt", "unusualWithdrawalPattern") or False
        )
        normalized["remote_access_or_tech_support_story"] = bool(
            _first_present(normalized, "remote_access_or_tech_support_story") or False
        )
        normalized["crypto_or_gift_card_request"] = bool(
            _first_present(normalized, "crypto_or_gift_card_request") or False
        )
        normalized["romance_or_emotional_dependency_pattern"] = bool(
            _first_present(normalized, "romance_or_emotional_dependency_pattern") or False
        )

        return normalized

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
    closure_summary: str
    follow_up_required: bool
    estimated_amount_protected: Optional[float] = None
    estimated_amount_lost: Optional[float] = None
    trusted_contact_engaged: bool = False
    fraud_ops_involved: bool = False
    closure_notes: Optional[str] = None

    @field_validator("estimated_amount_protected", "estimated_amount_lost", mode="before")
    @classmethod
    def normalize_tracked_amount(cls, value):
        if value in (None, ""):
            return None

        amount = float(value)
        if amount < 0:
            raise ValueError("Amount must be zero or greater")
        if amount > MAX_TRACKED_AMOUNT:
            raise ValueError(f"Amount must be ${MAX_TRACKED_AMOUNT:,.0f} or less")

        return round(amount, 2)


class CaseActionUpdate(BaseModel):
    action_type: str = "structured_action"
    label: str
    details: Optional[str] = None
    status: Optional[StatusType] = None
    assigned_owner: Optional[str] = None
    assigned_team: Optional[str] = None
    notes: Optional[str] = None
    money_already_left: Optional[bool] = None
    outcome_type: Optional[OutcomeType] = None
    closure_notes: Optional[str] = None


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
    case_intelligence: dict[str, Any]

    notes: str
    outcome_type: Optional[str] = None
    closure_notes: Optional[str] = None
    closure_summary: Optional[str] = None
    estimated_amount_protected: Optional[float] = None
    estimated_amount_lost: Optional[float] = None
    trusted_contact_engaged: Optional[bool] = None
    fraud_ops_involved: Optional[bool] = None
    follow_up_required: Optional[bool] = None
    closed_at: Optional[str] = None

    action_logs: list[ActionLogResponse]
