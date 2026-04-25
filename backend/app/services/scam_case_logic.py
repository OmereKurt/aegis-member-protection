from typing import Optional

from app.schemas.scam_case import ScamCaseIntakeRequest


PATTERN_LABELS = {
    "romance": "Romance / companionship",
    "family_emergency": "Grandparent / emergency",
    "government_imposter": "Government imposter",
    "tech_support": "Tech support",
    "sweepstakes_prize": "Sweepstakes / prize",
    "caregiver_coercion": "Caregiver coercion",
    "investment_crypto": "Investment / crypto",
    "account_takeover_social_engineering": "Account takeover / social engineering",
    "bank_imposter": "Account takeover / social engineering",
    "unknown": "Unknown / other",
}


def extract_risk_factors(payload: ScamCaseIntakeRequest) -> dict:
    return {
        "phone_based_imposter_story": payload.phone_based_imposter_story,
        "government_or_bank_brand_impersonation": payload.government_or_bank_brand_impersonation,
        "fear_or_urgency_language": payload.fear_or_urgency_language,
        "secrecy_pressure": payload.secrecy_pressure,
        "high_dollar_amount": payload.high_dollar_amount or payload.amount_at_risk >= 10000,
        "older_or_vulnerable_customer": payload.older_or_vulnerable_customer
        or payload.vulnerable_adult_flag
        or payload.age_band in {"70_79", "80_plus"},
        "repeat_attempt": payload.repeat_attempt,
        "remote_access_or_tech_support_story": payload.remote_access_or_tech_support_story,
        "crypto_or_gift_card_request": payload.crypto_or_gift_card_request,
        "romance_or_emotional_dependency_pattern": payload.romance_or_emotional_dependency_pattern,
        "money_already_left": payload.money_already_left,
        "customer_currently_on_call_with_scammer": payload.customer_currently_on_call_with_scammer,
        "new_payee_or_destination": payload.new_payee_or_destination,
        "customer_told_to_keep_secret": payload.customer_told_to_keep_secret,
    }


def classify_scam_type(payload: ScamCaseIntakeRequest) -> str:
    narrative = payload.narrative.lower()

    if payload.romance_or_emotional_dependency_pattern:
        return "romance"

    if any(term in narrative for term in ["caregiver", "home aide", "helper is making", "power of attorney"]):
        return "caregiver_coercion"

    if any(term in narrative for term in ["sweepstakes", "prize", "lottery", "winner", "processing fee"]):
        return "sweepstakes_prize"

    if payload.crypto_or_gift_card_request or any(term in narrative for term in ["crypto", "bitcoin", "gift card"]):
        return "investment_crypto"

    if payload.remote_access_or_tech_support_story or any(
        term in narrative for term in ["microsoft", "apple support", "tech support", "remote access", "computer virus"]
    ):
        return "tech_support"

    if any(term in narrative for term in ["grandson", "granddaughter", "family emergency", "bail money"]):
        return "family_emergency"

    if payload.government_or_bank_brand_impersonation:
        if any(term in narrative for term in ["bank", "fraud department", "zelle", "wire", "account", "debit card"]):
            return "bank_imposter"
        return "government_imposter"

    if any(term in narrative for term in ["one-time code", "verification code", "password", "login", "account takeover"]):
        return "account_takeover_social_engineering"

    return "unknown"


def score_urgency(payload: ScamCaseIntakeRequest, risk_factors: dict) -> tuple[int, str, list[str]]:
    score = 0
    reasons = []

    if risk_factors["customer_currently_on_call_with_scammer"]:
        score += 25
        reasons.append("Customer may still be in live contact with the scammer")

    if risk_factors["money_already_left"]:
        score += 25
        reasons.append("Funds may already have left or the transfer may already be in motion")

    if risk_factors["high_dollar_amount"]:
        score += 20
        reasons.append("The amount at risk is high")

    if risk_factors["older_or_vulnerable_customer"]:
        score += 20
        reasons.append("The customer appears older or otherwise vulnerable")

    if risk_factors["secrecy_pressure"] or risk_factors["customer_told_to_keep_secret"]:
        score += 15
        reasons.append("The customer appears to have been pressured into secrecy")

    if risk_factors["new_payee_or_destination"]:
        score += 15
        reasons.append("A new payee or destination is involved")

    if risk_factors["government_or_bank_brand_impersonation"]:
        score += 20
        reasons.append("The narrative suggests a bank or government imposter scam")

    if risk_factors["crypto_or_gift_card_request"]:
        score += 20
        reasons.append("Crypto or gift-card style payment pressure is present")

    if risk_factors["remote_access_or_tech_support_story"]:
        score += 15
        reasons.append("The narrative suggests tech-support or remote-access coercion")

    if risk_factors["romance_or_emotional_dependency_pattern"]:
        score += 15
        reasons.append("Emotional dependency or romance-style manipulation is present")

    if risk_factors["fear_or_urgency_language"]:
        score += 10
        reasons.append("Fear or urgency language was used")

    if risk_factors["repeat_attempt"]:
        score += 10
        reasons.append("This may be part of a repeated or continuing scam attempt")

    if score >= 75:
        urgency = "Critical"
    elif score >= 50:
        urgency = "High"
    elif score >= 25:
        urgency = "Medium"
    else:
        urgency = "Low"

    return score, urgency, reasons


def build_escalation_path(
    scam_type: str,
    urgency: str,
    source_unit: str,
    risk_factors: dict,
) -> list[str]:
    steps = []

    normalized_source = source_unit.strip() if source_unit.strip() else "Source Unit"

    steps.append(f"Document the concern within {normalized_source} and move the case into active review.")

    if urgency in {"High", "Critical"}:
        steps.append("Notify a supervisor or team lead immediately.")

    if urgency in {"Medium", "High", "Critical"}:
        steps.append("Route the case to Fraud Operations for review before funds move.")

    if risk_factors["older_or_vulnerable_customer"]:
        steps.append("Consider trusted contact outreach if institution policy allows it.")

    if risk_factors["money_already_left"] or urgency == "Critical":
        steps.append("Prioritize rapid loss-mitigation review and determine whether external reporting is needed.")

    if scam_type in {"bank_imposter", "government_imposter", "investment_crypto"}:
        steps.append("Escalate for enhanced fraud review because the narrative suggests a high-risk impersonation or funds-transfer scam.")

    return steps


def build_playbook(scam_type: str, urgency: str, risk_factors: dict, source_unit: str) -> dict:
    recommended_questions = [
        "Who contacted you and how?",
        "Did they ask you to keep this secret from family or bank staff?",
        "Are you still in contact with them right now?",
    ]

    recommended_actions = [
        "Pause the transaction review and gather the facts",
        "Document the customer’s explanation in plain language",
        "Confirm whether a new payee, destination, or unusual transfer is involved",
    ]

    escalation_required = urgency in {"High", "Critical"}
    hold_recommended = urgency in {"High", "Critical"} or risk_factors["money_already_left"]
    trusted_contact_recommended = risk_factors["older_or_vulnerable_customer"] and urgency in {"Medium", "High", "Critical"}
    law_enforcement_reporting_recommended = urgency == "Critical"

    if scam_type == "bank_imposter":
        recommended_questions.append("Did the caller claim to be from your bank’s fraud department?")
        recommended_actions.append("Do not rely on the caller’s instructions; verify through official bank channels")

    if scam_type == "government_imposter":
        recommended_questions.append("Did the caller claim to be from the IRS, Social Security, or law enforcement?")
        recommended_actions.append("Pause action until identity can be independently verified")

    if scam_type == "tech_support":
        recommended_questions.append("Did anyone ask for remote access to your computer or phone?")
        recommended_actions.append("Treat remote-access or tech-support stories as high risk")

    if scam_type == "family_emergency":
        recommended_questions.append("Has anyone asked for immediate money for a family emergency or bail?")
        recommended_actions.append("Verify the claimed emergency with a trusted family member before funds move")

    if scam_type == "investment_crypto":
        recommended_questions.append("Were you told to move money into crypto, gift cards, or an investment platform?")
        recommended_actions.append("Escalate quickly if crypto, gift cards, or investment coercion is involved")

    if scam_type == "romance":
        recommended_questions.append("Has someone you know online been asking for money or secrecy?")
        recommended_actions.append("Treat repeated emotional pressure and isolation as a serious risk factor")

    if scam_type == "sweepstakes_prize":
        recommended_questions.append("Were you told to pay taxes, fees, or shipping before receiving a prize?")
        recommended_actions.append("Verify the prize claim independently before any payment leaves the account")

    if scam_type == "caregiver_coercion":
        recommended_questions.append("Is a caregiver, aide, or household helper influencing this transaction?")
        recommended_actions.append("Escalate for vulnerable-adult review and document who is present or pressuring the member")

    if scam_type == "account_takeover_social_engineering":
        recommended_questions.append("Did anyone ask for a password, one-time code, or login verification?")
        recommended_actions.append("Review recent account access and verify member intent through trusted channels")

    recommended_escalation_path = build_escalation_path(
        scam_type=scam_type,
        urgency=urgency,
        source_unit=source_unit,
        risk_factors=risk_factors,
    )

    return {
        "recommended_questions": recommended_questions,
        "recommended_actions": recommended_actions,
        "recommended_escalation_path": recommended_escalation_path,
        "escalation_required": escalation_required,
        "hold_recommended": hold_recommended,
        "trusted_contact_recommended": trusted_contact_recommended,
        "law_enforcement_reporting_recommended": law_enforcement_reporting_recommended,
    }


def build_title_and_summary(
    scam_type: str,
    urgency: str,
    customer_identifier: str,
    amount_at_risk: float,
) -> tuple[str, str]:
    human_names = {
        "bank_imposter": "Bank Imposter",
        "government_imposter": "Government Imposter",
        "tech_support": "Tech Support",
        "family_emergency": "Family Emergency",
        "sweepstakes_prize": "Sweepstakes / Prize",
        "caregiver_coercion": "Caregiver Coercion",
        "investment_crypto": "Investment / Crypto",
        "account_takeover_social_engineering": "Account Takeover / Social Engineering",
        "romance": "Romance",
        "unknown": "Unknown Scam Pattern",
    }

    label = human_names.get(scam_type, "Unknown Scam Pattern")
    title = f"{label} Case - {customer_identifier}"
    summary = (
        f"Suspected {label.lower()} scenario for customer {customer_identifier} "
        f"with {urgency.lower()} urgency and approximately ${amount_at_risk:,.2f} at risk."
    )
    return title, summary


def _signal(
    label: str,
    present: bool,
    evidence: str,
    severity: str = "medium",
) -> dict:
    return {
        "label": label,
        "present": present,
        "severity": severity if present else "watch",
        "evidence": evidence if present else "Not indicated in the current intake.",
    }


def build_case_intelligence(
    *,
    scam_type: str,
    urgency: str,
    urgency_score: int,
    urgency_reasons: list[str],
    risk_factors: dict,
    playbook: dict,
    customer_identifier: str,
    full_name: Optional[str],
    source_unit: str,
    trusted_contact_exists: bool,
    trusted_contact_name: Optional[str],
    trusted_contact_phone: Optional[str],
    assigned_owner: Optional[str],
    assigned_team: Optional[str],
    notes: Optional[str],
    amount_at_risk: float,
    transaction_type: str,
) -> dict:
    structured_signals = [
        _signal(
            "Real-time coaching",
            bool(risk_factors.get("customer_currently_on_call_with_scammer")),
            "Member may still be in live contact with the scammer.",
            "high",
        ),
        _signal(
            "Secrecy instruction",
            bool(risk_factors.get("secrecy_pressure") or risk_factors.get("customer_told_to_keep_secret")),
            "Member was told to keep the transaction secret or avoid normal verification.",
            "high",
        ),
        _signal(
            "New payee or destination",
            bool(risk_factors.get("new_payee_or_destination")),
            "The transaction involves a new recipient, destination, or channel.",
            "medium",
        ),
        _signal(
            "High-dollar transfer",
            bool(risk_factors.get("high_dollar_amount")),
            f"Amount at risk is approximately ${amount_at_risk:,.2f}.",
            "high",
        ),
        _signal(
            "Repeated transaction attempts",
            bool(risk_factors.get("repeat_attempt")),
            "Staff indicated a repeated or continuing attempt.",
            "medium",
        ),
        _signal(
            "Vulnerable adult indicator",
            bool(risk_factors.get("older_or_vulnerable_customer")),
            "Age band or staff observation suggests elevated vulnerability.",
            "high",
        ),
        _signal(
            "Third-party pressure",
            bool(
                risk_factors.get("phone_based_imposter_story")
                or risk_factors.get("government_or_bank_brand_impersonation")
                or scam_type in {"romance", "caregiver_coercion"}
            ),
            "The narrative suggests an outside party is influencing the member.",
            "medium",
        ),
        _signal(
            "Urgent emotional framing",
            bool(risk_factors.get("fear_or_urgency_language") or scam_type in {"family_emergency", "romance"}),
            "The case includes fear, emergency, or emotional dependency framing.",
            "medium",
        ),
    ]

    present_signals = [signal for signal in structured_signals if signal["present"]]
    risk_drivers = [signal["label"] for signal in present_signals]
    risk_drivers.extend(reason for reason in urgency_reasons if reason not in risk_drivers)

    missing_information = []
    if not full_name:
        missing_information.append("Member full name or verified identity context")
    if trusted_contact_exists and not (trusted_contact_name and trusted_contact_phone):
        missing_information.append("Trusted contact name and phone")
    if not trusted_contact_exists:
        missing_information.append("Trusted contact availability")
    if not assigned_owner and not assigned_team:
        missing_information.append("Clear owner for next intervention step")
    if not notes:
        missing_information.append("Operator notes from first review")
    if not transaction_type or transaction_type == "other":
        missing_information.append("Specific transaction channel or destination details")

    if urgency_score >= 75:
        signal_strength = "Critical"
    elif urgency_score >= 50:
        signal_strength = "Strong"
    elif urgency_score >= 25:
        signal_strength = "Moderate"
    else:
        signal_strength = "Limited"

    recommended_next_steps = list(playbook.get("recommended_actions") or [])
    if "Clear owner for next intervention step" in missing_information:
        recommended_next_steps.append("Assign a named owner before the next member contact.")
    if urgency in {"High", "Critical"}:
        recommended_next_steps.append("Complete supervisor or Fraud Ops escalation before funds move.")

    why_high_risk = urgency_reasons[:] or [
        f"Current signal strength is {signal_strength.lower()} based on the intake details from {source_unit}."
    ]
    if present_signals:
        why_high_risk.append(
            "Structured signals present: " + ", ".join(signal["label"] for signal in present_signals[:4]) + "."
        )

    return {
        "likely_pattern_code": scam_type,
        "likely_pattern": PATTERN_LABELS.get(scam_type, PATTERN_LABELS["unknown"]),
        "signal_strength": signal_strength,
        "risk_drivers": risk_drivers[:8],
        "missing_information": missing_information[:6],
        "recommended_next_steps": recommended_next_steps[:6],
        "suggested_escalation_path": list(playbook.get("recommended_escalation_path") or [])[:6],
        "structured_signals": structured_signals,
        "why_high_risk": why_high_risk[:5],
        "member_context": {
            "display_name": full_name or customer_identifier,
            "source_unit": source_unit,
            "transaction_type": transaction_type,
            "amount_at_risk": amount_at_risk,
            "trusted_contact_available": trusted_contact_exists,
        },
    }


def build_case_artifacts(payload: ScamCaseIntakeRequest) -> dict:
    risk_factors = extract_risk_factors(payload)
    scam_type = classify_scam_type(payload)
    urgency_score, urgency, urgency_reasons = score_urgency(payload, risk_factors)
    playbook = build_playbook(
        scam_type=scam_type,
        urgency=urgency,
        risk_factors=risk_factors,
        source_unit=payload.source_unit,
    )
    title, summary = build_title_and_summary(scam_type, urgency, payload.customer_identifier, payload.amount_at_risk)
    case_intelligence = build_case_intelligence(
        scam_type=scam_type,
        urgency=urgency,
        urgency_score=urgency_score,
        urgency_reasons=urgency_reasons,
        risk_factors=risk_factors,
        playbook=playbook,
        customer_identifier=payload.customer_identifier,
        full_name=payload.full_name,
        source_unit=payload.source_unit,
        trusted_contact_exists=payload.trusted_contact_exists,
        trusted_contact_name=payload.trusted_contact_name,
        trusted_contact_phone=payload.trusted_contact_phone,
        assigned_owner=None,
        assigned_team=None,
        notes=None,
        amount_at_risk=payload.amount_at_risk,
        transaction_type=payload.transaction_type,
    )

    return {
        "risk_factors": risk_factors,
        "scam_type": scam_type,
        "urgency_score": urgency_score,
        "urgency": urgency,
        "urgency_reasons": urgency_reasons,
        "playbook": playbook,
        "case_intelligence": case_intelligence,
        "title": title,
        "summary": summary,
    }
