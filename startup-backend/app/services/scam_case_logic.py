from app.schemas.scam_case import ScamCaseIntakeRequest


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


def build_playbook(scam_type: str, urgency: str, risk_factors: dict) -> dict:
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

    return {
        "recommended_questions": recommended_questions,
        "recommended_actions": recommended_actions,
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
        "investment_crypto": "Investment / Crypto",
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


def build_case_artifacts(payload: ScamCaseIntakeRequest) -> dict:
    risk_factors = extract_risk_factors(payload)
    scam_type = classify_scam_type(payload)
    urgency_score, urgency, urgency_reasons = score_urgency(payload, risk_factors)
    playbook = build_playbook(scam_type, urgency, risk_factors)
    title, summary = build_title_and_summary(scam_type, urgency, payload.customer_identifier, payload.amount_at_risk)

    return {
        "risk_factors": risk_factors,
        "scam_type": scam_type,
        "urgency_score": urgency_score,
        "urgency": urgency,
        "urgency_reasons": urgency_reasons,
        "playbook": playbook,
        "title": title,
        "summary": summary,
    }
