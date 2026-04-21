import json
import os
from pathlib import Path

from app.core.database import Base, SessionLocal, engine
from app.models.action_log import ActionLog
from app.models.scam_case import ScamCase

DB_FILE = Path("startup_scam_ops.db")


def reset_database():
    if DB_FILE.exists():
        DB_FILE.unlink()

    Base.metadata.create_all(bind=engine)


def add_case(db, payload):
    case = ScamCase(
        case_id=payload["case_id"],
        status=payload["status"],
        urgency=payload["urgency"],
        urgency_score=payload["urgency_score"],
        scam_type=payload["scam_type"],
        title=payload["title"],
        summary=payload["summary"],
        customer_identifier=payload["customer_identifier"],
        full_name=payload["full_name"],
        age_band=payload["age_band"],
        vulnerable_adult_flag=payload["vulnerable_adult_flag"],
        source_unit=payload["source_unit"],
        assigned_owner=payload["assigned_owner"],
        assigned_team=payload["assigned_team"],
        trusted_contact_exists=payload["trusted_contact_exists"],
        trusted_contact_name=payload["trusted_contact_name"],
        trusted_contact_phone=payload["trusted_contact_phone"],
        intake_channel=payload["intake_channel"],
        transaction_type=payload["transaction_type"],
        amount_at_risk=payload["amount_at_risk"],
        money_already_left=payload["money_already_left"],
        customer_currently_on_call_with_scammer=payload["customer_currently_on_call_with_scammer"],
        new_payee_or_destination=payload["new_payee_or_destination"],
        customer_told_to_keep_secret=payload["customer_told_to_keep_secret"],
        narrative=payload["narrative"],
        risk_factors_json=json.dumps(payload["risk_factors"]),
        urgency_reasons_json=json.dumps(payload["urgency_reasons"]),
        playbook_json=json.dumps(payload["playbook"]),
        notes=payload["notes"],
        outcome_type=payload["outcome_type"],
        closure_notes=payload["closure_notes"],
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    for log in payload["action_logs"]:
        db.add(
            ActionLog(
                scam_case_id=case.id,
                action_type=log["action_type"],
                details=log["details"],
            )
        )

    db.commit()


def seed():
    reset_database()
    db = SessionLocal()

    try:
        demo_cases = [
            {
                "case_id": "CASE-DEMO01",
                "status": "Closed",
                "urgency": "Critical",
                "urgency_score": 95,
                "scam_type": "bank_imposter",
                "title": "Bank Imposter Case - CU-10021",
                "summary": "Suspected bank imposter scenario for customer CU-10021 with critical urgency and approximately $18,500.00 at risk.",
                "customer_identifier": "CU-10021",
                "full_name": "Evelyn Carter",
                "age_band": "70_79",
                "vulnerable_adult_flag": True,
                "source_unit": "Downtown Branch",
                "assigned_owner": "Taylor Smith",
                "assigned_team": "Fraud Operations",
                "trusted_contact_exists": True,
                "trusted_contact_name": "Michael Carter",
                "trusted_contact_phone": "555-222-1188",
                "intake_channel": "branch",
                "transaction_type": "wire",
                "amount_at_risk": 18500,
                "money_already_left": False,
                "customer_currently_on_call_with_scammer": True,
                "new_payee_or_destination": True,
                "customer_told_to_keep_secret": True,
                "narrative": "Member stated a caller claiming to be from the bank fraud department instructed an urgent wire transfer to protect retirement funds.",
                "risk_factors": {
                    "phone_based_imposter_story": True,
                    "government_or_bank_brand_impersonation": True,
                    "fear_or_urgency_language": True,
                    "secrecy_pressure": True,
                    "high_dollar_amount": True,
                    "older_or_vulnerable_customer": True,
                    "repeat_attempt": False,
                    "remote_access_or_tech_support_story": False,
                    "crypto_or_gift_card_request": False,
                    "romance_or_emotional_dependency_pattern": False,
                    "money_already_left": False,
                    "customer_currently_on_call_with_scammer": True,
                    "new_payee_or_destination": True,
                    "customer_told_to_keep_secret": True,
                },
                "urgency_reasons": [
                    "Customer may still be in live contact with the scammer",
                    "The amount at risk is high",
                    "The customer appears older or otherwise vulnerable",
                    "The customer appears to have been pressured into secrecy",
                    "A new payee or destination is involved",
                    "The narrative suggests a bank or government imposter scam",
                    "Fear or urgency language was used",
                ],
                "playbook": {
                    "recommended_questions": [
                        "Who contacted you and how?",
                        "Did they ask you to keep this secret from family or bank staff?",
                        "Are you still in contact with them right now?",
                        "Did the caller claim to be from your bank’s fraud department?",
                    ],
                    "recommended_actions": [
                        "Pause the transaction review and gather the facts",
                        "Document the customer’s explanation in plain language",
                        "Confirm whether a new payee, destination, or unusual transfer is involved",
                        "Do not rely on the caller’s instructions; verify through official bank channels",
                    ],
                    "recommended_escalation_path": [
                        "Document the concern within Downtown Branch and move the case into active review.",
                        "Notify a supervisor or team lead immediately.",
                        "Route the case to Fraud Operations for review before funds move.",
                        "Consider trusted contact outreach if institution policy allows it.",
                        "Prioritize rapid loss-mitigation review and determine whether external reporting is needed.",
                        "Escalate for enhanced fraud review because the narrative suggests a high-risk impersonation or funds-transfer scam.",
                    ],
                    "escalation_required": True,
                    "hold_recommended": True,
                    "trusted_contact_recommended": True,
                    "law_enforcement_reporting_recommended": True,
                },
                "notes": "Member was intercepted in branch before wire was sent. Trusted contact confirmed scam suspicion.",
                "outcome_type": "customer_protected",
                "closure_notes": "Wire was stopped before funds left. Member educated and trusted contact engaged.",
                "action_logs": [
                    {"action_type": "case_created", "details": "Case created from Downtown Branch with Critical urgency and scam type bank_imposter."},
                    {"action_type": "assignment_updated", "details": "Assignment updated to owner: Taylor Smith; team: Fraud Operations."},
                    {"action_type": "status_changed", "details": "Status changed from New to In Review."},
                    {"action_type": "notes_updated", "details": "Member was intercepted in branch before wire was sent. Trusted contact confirmed scam suspicion."},
                    {"action_type": "case_closed", "details": "Case closed with outcome customer_protected."},
                ],
            },
            {
                "case_id": "CASE-DEMO02",
                "status": "Escalated",
                "urgency": "High",
                "urgency_score": 65,
                "scam_type": "tech_support",
                "title": "Tech Support Case - CU-20488",
                "summary": "Suspected tech support scenario for customer CU-20488 with high urgency and approximately $4,200.00 at risk.",
                "customer_identifier": "CU-20488",
                "full_name": "Janet Walker",
                "age_band": "80_plus",
                "vulnerable_adult_flag": True,
                "source_unit": "Contact Center",
                "assigned_owner": "Morgan Lee",
                "assigned_team": "Fraud Operations",
                "trusted_contact_exists": True,
                "trusted_contact_name": "Ryan Walker",
                "trusted_contact_phone": "555-814-7721",
                "intake_channel": "phone",
                "transaction_type": "card",
                "amount_at_risk": 4200,
                "money_already_left": False,
                "customer_currently_on_call_with_scammer": False,
                "new_payee_or_destination": False,
                "customer_told_to_keep_secret": True,
                "narrative": "Member reported a caller claiming Microsoft found malware and requested remote access and payment for cleanup.",
                "risk_factors": {
                    "phone_based_imposter_story": True,
                    "government_or_bank_brand_impersonation": False,
                    "fear_or_urgency_language": True,
                    "secrecy_pressure": True,
                    "high_dollar_amount": False,
                    "older_or_vulnerable_customer": True,
                    "repeat_attempt": False,
                    "remote_access_or_tech_support_story": True,
                    "crypto_or_gift_card_request": False,
                    "romance_or_emotional_dependency_pattern": False,
                    "money_already_left": False,
                    "customer_currently_on_call_with_scammer": False,
                    "new_payee_or_destination": False,
                    "customer_told_to_keep_secret": True,
                },
                "urgency_reasons": [
                    "The customer appears older or otherwise vulnerable",
                    "The customer appears to have been pressured into secrecy",
                    "The narrative suggests tech-support or remote-access coercion",
                    "Fear or urgency language was used",
                ],
                "playbook": {
                    "recommended_questions": [
                        "Who contacted you and how?",
                        "Did they ask you to keep this secret from family or bank staff?",
                        "Are you still in contact with them right now?",
                        "Did anyone ask for remote access to your computer or phone?",
                    ],
                    "recommended_actions": [
                        "Pause the transaction review and gather the facts",
                        "Document the customer’s explanation in plain language",
                        "Confirm whether a new payee, destination, or unusual transfer is involved",
                        "Treat remote-access or tech-support stories as high risk",
                    ],
                    "recommended_escalation_path": [
                        "Document the concern within Contact Center and move the case into active review.",
                        "Notify a supervisor or team lead immediately.",
                        "Route the case to Fraud Operations for review before funds move.",
                        "Consider trusted contact outreach if institution policy allows it.",
                    ],
                    "escalation_required": True,
                    "hold_recommended": True,
                    "trusted_contact_recommended": True,
                    "law_enforcement_reporting_recommended": False,
                },
                "notes": "Card activity reviewed; case escalated pending device compromise guidance.",
                "outcome_type": None,
                "closure_notes": None,
                "action_logs": [
                    {"action_type": "case_created", "details": "Case created from Contact Center with High urgency and scam type tech_support."},
                    {"action_type": "assignment_updated", "details": "Assignment updated to owner: Morgan Lee; team: Fraud Operations."},
                    {"action_type": "status_changed", "details": "Status changed from New to Escalated."},
                    {"action_type": "notes_updated", "details": "Card activity reviewed; case escalated pending device compromise guidance."},
                ],
            },
            {
                "case_id": "CASE-DEMO03",
                "status": "Closed",
                "urgency": "High",
                "urgency_score": 70,
                "scam_type": "investment_crypto",
                "title": "Investment / Crypto Case - CU-33091",
                "summary": "Suspected investment / crypto scenario for customer CU-33091 with high urgency and approximately $12,000.00 at risk.",
                "customer_identifier": "CU-33091",
                "full_name": "Harold Benson",
                "age_band": "60_69",
                "vulnerable_adult_flag": False,
                "source_unit": "Fraud Operations",
                "assigned_owner": "Priya Patel",
                "assigned_team": "Fraud Operations",
                "trusted_contact_exists": False,
                "trusted_contact_name": None,
                "trusted_contact_phone": None,
                "intake_channel": "online",
                "transaction_type": "crypto",
                "amount_at_risk": 12000,
                "money_already_left": True,
                "customer_currently_on_call_with_scammer": False,
                "new_payee_or_destination": True,
                "customer_told_to_keep_secret": False,
                "narrative": "Member disclosed being coached into moving funds to crypto after being promised guaranteed returns.",
                "risk_factors": {
                    "phone_based_imposter_story": False,
                    "government_or_bank_brand_impersonation": False,
                    "fear_or_urgency_language": False,
                    "secrecy_pressure": False,
                    "high_dollar_amount": True,
                    "older_or_vulnerable_customer": False,
                    "repeat_attempt": True,
                    "remote_access_or_tech_support_story": False,
                    "crypto_or_gift_card_request": True,
                    "romance_or_emotional_dependency_pattern": False,
                    "money_already_left": True,
                    "customer_currently_on_call_with_scammer": False,
                    "new_payee_or_destination": True,
                    "customer_told_to_keep_secret": False,
                },
                "urgency_reasons": [
                    "Funds may already have left or the transfer may already be in motion",
                    "The amount at risk is high",
                    "A new payee or destination is involved",
                    "Crypto or gift-card style payment pressure is present",
                    "This may be part of a repeated or continuing scam attempt",
                ],
                "playbook": {
                    "recommended_questions": [
                        "Who contacted you and how?",
                        "Did they ask you to keep this secret from family or bank staff?",
                        "Are you still in contact with them right now?",
                        "Were you told to move money into crypto, gift cards, or an investment platform?",
                    ],
                    "recommended_actions": [
                        "Pause the transaction review and gather the facts",
                        "Document the customer’s explanation in plain language",
                        "Confirm whether a new payee, destination, or unusual transfer is involved",
                        "Escalate quickly if crypto, gift cards, or investment coercion is involved",
                    ],
                    "recommended_escalation_path": [
                        "Document the concern within Fraud Operations and move the case into active review.",
                        "Notify a supervisor or team lead immediately.",
                        "Route the case to Fraud Operations for review before funds move.",
                        "Prioritize rapid loss-mitigation review and determine whether external reporting is needed.",
                        "Escalate for enhanced fraud review because the narrative suggests a high-risk impersonation or funds-transfer scam.",
                    ],
                    "escalation_required": True,
                    "hold_recommended": True,
                    "trusted_contact_recommended": False,
                    "law_enforcement_reporting_recommended": False,
                },
                "notes": "Funds had already moved before intervention. Member advised on next steps and documentation.",
                "outcome_type": "funds_lost",
                "closure_notes": "Loss confirmed after crypto transfer completed before hold could be attempted.",
                "action_logs": [
                    {"action_type": "case_created", "details": "Case created from Fraud Operations with High urgency and scam type investment_crypto."},
                    {"action_type": "assignment_updated", "details": "Assignment updated to owner: Priya Patel; team: Fraud Operations."},
                    {"action_type": "status_changed", "details": "Status changed from New to In Review."},
                    {"action_type": "case_closed", "details": "Case closed with outcome funds_lost."},
                ],
            },
            {
                "case_id": "CASE-DEMO04",
                "status": "In Review",
                "urgency": "Medium",
                "urgency_score": 35,
                "scam_type": "family_emergency",
                "title": "Family Emergency Case - CU-44802",
                "summary": "Suspected family emergency scenario for customer CU-44802 with medium urgency and approximately $2,500.00 at risk.",
                "customer_identifier": "CU-44802",
                "full_name": "Lillian Moore",
                "age_band": "70_79",
                "vulnerable_adult_flag": True,
                "source_unit": "North Branch",
                "assigned_owner": "Alex Gomez",
                "assigned_team": "Retail Branch Operations",
                "trusted_contact_exists": True,
                "trusted_contact_name": "Dana Moore",
                "trusted_contact_phone": "555-316-4400",
                "intake_channel": "branch",
                "transaction_type": "cash_withdrawal",
                "amount_at_risk": 2500,
                "money_already_left": False,
                "customer_currently_on_call_with_scammer": False,
                "new_payee_or_destination": False,
                "customer_told_to_keep_secret": False,
                "narrative": "Member requested urgent cash withdrawal after receiving a call about a grandchild needing bail money.",
                "risk_factors": {
                    "phone_based_imposter_story": True,
                    "government_or_bank_brand_impersonation": False,
                    "fear_or_urgency_language": True,
                    "secrecy_pressure": False,
                    "high_dollar_amount": False,
                    "older_or_vulnerable_customer": True,
                    "repeat_attempt": False,
                    "remote_access_or_tech_support_story": False,
                    "crypto_or_gift_card_request": False,
                    "romance_or_emotional_dependency_pattern": False,
                    "money_already_left": False,
                    "customer_currently_on_call_with_scammer": False,
                    "new_payee_or_destination": False,
                    "customer_told_to_keep_secret": False,
                },
                "urgency_reasons": [
                    "The customer appears older or otherwise vulnerable",
                    "Fear or urgency language was used",
                ],
                "playbook": {
                    "recommended_questions": [
                        "Who contacted you and how?",
                        "Did they ask you to keep this secret from family or bank staff?",
                        "Are you still in contact with them right now?",
                        "Has anyone asked for immediate money for a family emergency or bail?",
                    ],
                    "recommended_actions": [
                        "Pause the transaction review and gather the facts",
                        "Document the customer’s explanation in plain language",
                        "Confirm whether a new payee, destination, or unusual transfer is involved",
                        "Verify the claimed emergency with a trusted family member before funds move",
                    ],
                    "recommended_escalation_path": [
                        "Document the concern within North Branch and move the case into active review.",
                        "Route the case to Fraud Operations for review before funds move.",
                        "Consider trusted contact outreach if institution policy allows it.",
                    ],
                    "escalation_required": False,
                    "hold_recommended": False,
                    "trusted_contact_recommended": True,
                    "law_enforcement_reporting_recommended": False,
                },
                "notes": "Awaiting callback from trusted contact before allowing withdrawal.",
                "outcome_type": None,
                "closure_notes": None,
                "action_logs": [
                    {"action_type": "case_created", "details": "Case created from North Branch with Medium urgency and scam type family_emergency."},
                    {"action_type": "assignment_updated", "details": "Assignment updated to owner: Alex Gomez; team: Retail Branch Operations."},
                    {"action_type": "status_changed", "details": "Status changed from New to In Review."},
                ],
            },
        ]

        for payload in demo_cases:
            add_case(db, payload)

        print("Demo seed data loaded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
