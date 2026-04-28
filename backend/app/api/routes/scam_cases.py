import json
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import SessionLocal
from app.core.security import Permission, rate_limit
from app.models.action_log import ActionLog
from app.models.scam_case import ScamCase
from app.models.system_audit_log import SystemAuditLog
from app.models.user import User
from app.schemas.scam_case import (
    CaseActionUpdate,
    CaseAssignmentUpdate,
    CaseCloseUpdate,
    CaseNotesUpdate,
    CaseStatusUpdate,
    ScamCaseIntakeRequest,
    ScamCaseResponse,
)
from app.services.scam_case_logic import build_case_artifacts, build_case_intelligence

router = APIRouter(prefix="/api/scam-cases", tags=["cases"])

WRITE_RATE_LIMIT = Depends(rate_limit("case_write", limit=120, window_seconds=60))
ADMIN_RATE_LIMIT = Depends(rate_limit("case_admin", limit=100, window_seconds=60))
VIEW_CASES = Depends(require_permission(Permission.view_cases))
CREATE_INTAKE = Depends(require_permission(Permission.create_intake))
UPDATE_CASE = Depends(require_permission(Permission.update_case))
CLOSE_CASE = Depends(require_permission(Permission.close_case))
VIEW_REPORTING = Depends(require_permission(Permission.view_reporting))
MANAGE_DEMO_DATA = Depends(require_permission(Permission.manage_demo_data))

OUTCOME_LABELS = {
    "member_protected": "Member protected",
    "funds_blocked_or_held": "Funds blocked or held",
    "trusted_contact_engaged": "Trusted contact engaged",
    "fraud_ops_escalation_completed": "Fraud ops escalation completed",
    "monitoring_only": "Monitoring only",
    "false_concern_no_exploitation_found": "False concern / no exploitation found",
    "funds_sent_loss_occurred": "Funds sent / loss occurred",
    "customer_unreachable": "Customer unreachable",
    "other": "Other",
    "customer_protected": "Member protected",
    "funds_blocked": "Funds blocked or held",
    "funds_lost": "Funds sent / loss occurred",
    "false_alarm": "False concern / no exploitation found",
    "follow_up_required": "Monitoring only",
    "unknown": "Other",
}

PLAYBOOK_STEPS = [
    "Verify member intent",
    "Confirm transaction / funds status",
    "Attempt safe member callback",
    "Consider trusted contact",
    "Escalate to supervisor or fraud ops",
    "Record intervention result",
    "Close case with outcome",
]

DEMO_CASES = [
    {
        "intake": {
            "customer_identifier": "MBR-10482",
            "full_name": "Evelyn Carter",
            "age_band": "80_plus",
            "vulnerable_adult_flag": True,
            "source_unit": "Downtown Branch",
            "trusted_contact_exists": True,
            "trusted_contact_name": "Melissa Carter",
            "trusted_contact_phone": "555-0134",
            "intake_channel": "branch",
            "transaction_type": "wire",
            "amount_at_risk": 18500,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": True,
            "new_payee_or_destination": True,
            "customer_told_to_keep_secret": True,
            "narrative": "Member is attempting an urgent wire after a caller claiming to be from Social Security said benefits would be suspended unless funds were moved today. The caller told her to stay on the phone and not tell branch staff.",
            "phone_based_imposter_story": True,
            "government_or_bank_brand_impersonation": True,
            "fear_or_urgency_language": True,
            "secrecy_pressure": True,
            "high_dollar_amount": True,
            "older_or_vulnerable_customer": True,
        },
        "status": "Escalated",
        "assigned_owner": "A. Nguyen",
        "assigned_team": "Member Protection",
        "playbook_completed": PLAYBOOK_STEPS[:3],
        "history": [
            ("structured_action", "Supervisor escalation recorded after live coaching indicators were confirmed."),
        ],
    },
    {
        "intake": {
            "customer_identifier": "MBR-11731",
            "full_name": "Martin Reyes",
            "age_band": "70_79",
            "vulnerable_adult_flag": True,
            "source_unit": "North Branch",
            "trusted_contact_exists": True,
            "trusted_contact_name": "Ana Reyes",
            "trusted_contact_phone": "555-0167",
            "intake_channel": "branch",
            "transaction_type": "ach",
            "amount_at_risk": 9400,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": False,
            "new_payee_or_destination": True,
            "customer_told_to_keep_secret": True,
            "narrative": "Member says a companion he met online needs emergency travel funds and asked him not to discuss the relationship with family. This is the third attempted transfer in two weeks.",
            "secrecy_pressure": True,
            "older_or_vulnerable_customer": True,
            "repeat_attempt": True,
            "romance_or_emotional_dependency_pattern": True,
        },
        "status": "In Review",
        "assigned_owner": "M. Patel",
        "assigned_team": "Member Protection",
        "playbook_completed": PLAYBOOK_STEPS[:4],
    },
    {
        "intake": {
            "customer_identifier": "MBR-12009",
            "full_name": "Gloria Bennett",
            "age_band": "70_79",
            "vulnerable_adult_flag": True,
            "source_unit": "Contact Center",
            "trusted_contact_exists": True,
            "trusted_contact_name": "Kevin Bennett",
            "trusted_contact_phone": "555-0198",
            "intake_channel": "phone",
            "transaction_type": "wire",
            "amount_at_risk": 12500,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": False,
            "new_payee_or_destination": True,
            "customer_told_to_keep_secret": False,
            "narrative": "Caller reported that her grandson needed bail money after a car accident. Contact center staff paused the wire and verified with family that the grandson was safe.",
            "phone_based_imposter_story": True,
            "fear_or_urgency_language": True,
            "high_dollar_amount": True,
            "older_or_vulnerable_customer": True,
        },
        "status": "Closed",
        "assigned_owner": "K. Brooks",
        "assigned_team": "Fraud Operations",
        "playbook_completed": PLAYBOOK_STEPS,
        "closure": {
            "outcome_type": "funds_blocked_or_held",
            "closure_summary": "Wire was held before release and family confirmed the emergency story was false.",
            "estimated_amount_protected": 12500,
            "estimated_amount_lost": 0,
            "trusted_contact_engaged": True,
            "fraud_ops_involved": True,
            "follow_up_required": False,
        },
    },
    {
        "intake": {
            "customer_identifier": "MBR-13244",
            "full_name": "Robert Hill",
            "age_band": "80_plus",
            "vulnerable_adult_flag": True,
            "source_unit": "Digital Banking",
            "trusted_contact_exists": False,
            "intake_channel": "online",
            "transaction_type": "card",
            "amount_at_risk": 3200,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": True,
            "new_payee_or_destination": False,
            "customer_told_to_keep_secret": True,
            "narrative": "Member called while a person claiming to be Microsoft support had remote access to his laptop and was asking him to buy gift cards to remove a computer virus.",
            "phone_based_imposter_story": True,
            "fear_or_urgency_language": True,
            "secrecy_pressure": True,
            "older_or_vulnerable_customer": True,
            "remote_access_or_tech_support_story": True,
            "crypto_or_gift_card_request": True,
        },
        "status": "Closed",
        "assigned_owner": "R. Coleman",
        "assigned_team": "Fraud Operations",
        "playbook_completed": PLAYBOOK_STEPS,
        "closure": {
            "outcome_type": "member_protected",
            "closure_summary": "Member disconnected the remote session, card controls were reviewed, and no payment left the account.",
            "estimated_amount_protected": 3200,
            "estimated_amount_lost": 0,
            "trusted_contact_engaged": False,
            "fraud_ops_involved": True,
            "follow_up_required": True,
        },
    },
    {
        "intake": {
            "customer_identifier": "MBR-14176",
            "full_name": "Elaine Moore",
            "age_band": "60_69",
            "vulnerable_adult_flag": False,
            "source_unit": "Fraud Queue",
            "trusted_contact_exists": False,
            "intake_channel": "advisor_report",
            "transaction_type": "check",
            "amount_at_risk": 2500,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": False,
            "new_payee_or_destination": True,
            "customer_told_to_keep_secret": False,
            "narrative": "Fraud queue detected a cashier's check request tied to a sweepstakes prize letter requiring processing fees before winnings could be released.",
        },
        "status": "New",
        "assigned_owner": None,
        "assigned_team": None,
        "playbook_completed": [],
    },
    {
        "intake": {
            "customer_identifier": "MBR-15023",
            "full_name": "Samuel Whitaker",
            "age_band": "80_plus",
            "vulnerable_adult_flag": True,
            "source_unit": "Downtown Branch",
            "trusted_contact_exists": False,
            "intake_channel": "branch",
            "transaction_type": "cash_withdrawal",
            "amount_at_risk": 22000,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": False,
            "new_payee_or_destination": False,
            "customer_told_to_keep_secret": True,
            "narrative": "Branch staff observed a home aide coaching the member through a large cash withdrawal. Member appeared uncomfortable and said the caregiver would be upset if the withdrawal was delayed.",
            "secrecy_pressure": True,
            "high_dollar_amount": True,
            "older_or_vulnerable_customer": True,
        },
        "status": "Escalated",
        "assigned_owner": "T. Wallace",
        "assigned_team": "Member Protection",
        "playbook_completed": PLAYBOOK_STEPS[:2],
        "playbook_skipped": ["Consider trusted contact"],
    },
    {
        "intake": {
            "customer_identifier": "MBR-16408",
            "full_name": "Linda Chen",
            "age_band": "60_69",
            "vulnerable_adult_flag": False,
            "source_unit": "Digital Banking",
            "trusted_contact_exists": True,
            "trusted_contact_name": "Grace Chen",
            "trusted_contact_phone": "555-0181",
            "intake_channel": "online",
            "transaction_type": "crypto",
            "amount_at_risk": 42000,
            "money_already_left": True,
            "customer_currently_on_call_with_scammer": False,
            "new_payee_or_destination": True,
            "customer_told_to_keep_secret": True,
            "narrative": "Member reported moving savings into a crypto investment platform after being coached by an online investment mentor. Additional transfer attempts were queued after the first funds left.",
            "secrecy_pressure": True,
            "high_dollar_amount": True,
            "repeat_attempt": True,
            "crypto_or_gift_card_request": True,
        },
        "status": "Closed",
        "assigned_owner": "Fraud Ops",
        "assigned_team": "Fraud Operations",
        "playbook_completed": PLAYBOOK_STEPS,
        "closure": {
            "outcome_type": "funds_sent_loss_occurred",
            "closure_summary": "Initial crypto transfer could not be recovered; remaining queued transfers were stopped and loss-mitigation guidance was provided.",
            "estimated_amount_protected": 8000,
            "estimated_amount_lost": 42000,
            "trusted_contact_engaged": True,
            "fraud_ops_involved": True,
            "follow_up_required": True,
        },
    },
    {
        "intake": {
            "customer_identifier": "MBR-17190",
            "full_name": "Anthony Price",
            "age_band": "70_79",
            "vulnerable_adult_flag": True,
            "source_unit": "Fraud Queue",
            "trusted_contact_exists": False,
            "intake_channel": "advisor_report",
            "transaction_type": "ach",
            "amount_at_risk": 7800,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": False,
            "new_payee_or_destination": True,
            "customer_told_to_keep_secret": False,
            "narrative": "Fraud monitoring flagged a new ACH destination after the member disclosed a one-time code to someone claiming to verify account security.",
            "government_or_bank_brand_impersonation": True,
            "older_or_vulnerable_customer": True,
            "repeat_attempt": True,
        },
        "status": "In Review",
        "assigned_owner": "Fraud Ops",
        "assigned_team": "Fraud Operations",
        "playbook_completed": ["Confirm transaction / funds status", "Escalate to supervisor or fraud ops"],
    },
    {
        "intake": {
            "customer_identifier": "MBR-18365",
            "full_name": "Patricia Lawson",
            "age_band": "70_79",
            "vulnerable_adult_flag": True,
            "source_unit": "Contact Center",
            "trusted_contact_exists": True,
            "trusted_contact_name": "Diane Lawson",
            "trusted_contact_phone": "555-0149",
            "intake_channel": "phone",
            "transaction_type": "wire",
            "amount_at_risk": 15000,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": True,
            "new_payee_or_destination": True,
            "customer_told_to_keep_secret": True,
            "narrative": "Caller claiming to be from the bank fraud department told the member to send funds to a safe account by wire and not discuss the issue with anyone at the branch.",
            "phone_based_imposter_story": True,
            "government_or_bank_brand_impersonation": True,
            "fear_or_urgency_language": True,
            "secrecy_pressure": True,
            "high_dollar_amount": True,
            "older_or_vulnerable_customer": True,
        },
        "status": "Closed",
        "assigned_owner": "K. Brooks",
        "assigned_team": "Fraud Operations",
        "playbook_completed": PLAYBOOK_STEPS,
        "closure": {
            "outcome_type": "fraud_ops_escalation_completed",
            "closure_summary": "Fraud Operations confirmed the safe-account story, cancelled the outgoing wire, and documented callback verification.",
            "estimated_amount_protected": 15000,
            "estimated_amount_lost": 0,
            "trusted_contact_engaged": True,
            "fraud_ops_involved": True,
            "follow_up_required": False,
        },
    },
    {
        "intake": {
            "customer_identifier": "MBR-19012",
            "full_name": "Harold Green",
            "age_band": "60_69",
            "vulnerable_adult_flag": False,
            "source_unit": "North Branch",
            "trusted_contact_exists": False,
            "intake_channel": "branch",
            "transaction_type": "cash_withdrawal",
            "amount_at_risk": 600,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": False,
            "new_payee_or_destination": False,
            "customer_told_to_keep_secret": False,
            "narrative": "Branch staff questioned a cash withdrawal after a nervous conversation. Member later clarified the funds were for a planned home repair deposit with a known local contractor.",
        },
        "status": "Closed",
        "assigned_owner": "M. Patel",
        "assigned_team": "Member Protection",
        "playbook_completed": PLAYBOOK_STEPS,
        "closure": {
            "outcome_type": "false_concern_no_exploitation_found",
            "closure_summary": "Review found no exploitation indicators after member clarification and branch follow-up.",
            "estimated_amount_protected": 0,
            "estimated_amount_lost": 0,
            "trusted_contact_engaged": False,
            "fraud_ops_involved": False,
            "follow_up_required": False,
        },
    },
]


def write_action_log(
    db: Session,
    scam_case_id: int,
    action_type: str,
    details: str,
    actor: Optional[User] = None,
):
    log = ActionLog(
        scam_case_id=scam_case_id,
        action_type=action_type,
        details=details,
        actor_email=actor.email if actor else None,
        actor_role=actor.role if actor else None,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def write_system_audit_log(
    db: Session,
    action_type: str,
    details: str,
    *,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
):
    log = SystemAuditLog(
        action_type=action_type,
        details=details,
        actor_email=actor_email,
        actor_role=actor_role,
        resource_type=resource_type,
        resource_id=resource_id,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def serialize_action_logs(db: Session, scam_case_id: int) -> list[dict]:
    logs = (
        db.query(ActionLog)
        .filter(ActionLog.scam_case_id == scam_case_id)
        .order_by(ActionLog.created_at.desc(), ActionLog.id.desc())
        .all()
    )

    return [
        {
            "id": log.id,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "action_type": log.action_type,
            "details": log.details,
            "actor_email": log.actor_email,
            "actor_role": log.actor_role,
        }
        for log in logs
    ]


def serialize_case(db: Session, case: ScamCase) -> dict:
    urgency_reasons = json.loads(case.urgency_reasons_json)
    risk_factors = json.loads(case.risk_factors_json)
    playbook = json.loads(case.playbook_json)

    return {
        "id": case.id,
        "case_id": case.case_id,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        "status": case.status,
        "urgency": case.urgency,
        "urgency_score": case.urgency_score,
        "scam_type": case.scam_type,
        "title": case.title,
        "summary": case.summary,
        "customer_identifier": case.customer_identifier,
        "full_name": case.full_name,
        "age_band": case.age_band,
        "vulnerable_adult_flag": case.vulnerable_adult_flag,
        "source_unit": case.source_unit,
        "assigned_owner": case.assigned_owner,
        "assigned_team": case.assigned_team,
        "trusted_contact_exists": case.trusted_contact_exists,
        "trusted_contact_name": case.trusted_contact_name,
        "trusted_contact_phone": case.trusted_contact_phone,
        "intake_channel": case.intake_channel,
        "transaction_type": case.transaction_type,
        "amount_at_risk": case.amount_at_risk,
        "money_already_left": case.money_already_left,
        "customer_currently_on_call_with_scammer": case.customer_currently_on_call_with_scammer,
        "new_payee_or_destination": case.new_payee_or_destination,
        "customer_told_to_keep_secret": case.customer_told_to_keep_secret,
        "narrative": case.narrative,
        "urgency_reasons": urgency_reasons,
        "risk_factors": risk_factors,
        "playbook": playbook,
        "case_intelligence": build_case_intelligence(
            scam_type=case.scam_type,
            urgency=case.urgency,
            urgency_score=case.urgency_score,
            urgency_reasons=urgency_reasons,
            risk_factors=risk_factors,
            playbook=playbook,
            customer_identifier=case.customer_identifier,
            full_name=case.full_name,
            source_unit=case.source_unit,
            trusted_contact_exists=case.trusted_contact_exists,
            trusted_contact_name=case.trusted_contact_name,
            trusted_contact_phone=case.trusted_contact_phone,
            assigned_owner=case.assigned_owner,
            assigned_team=case.assigned_team,
            notes=case.notes,
            amount_at_risk=case.amount_at_risk,
            transaction_type=case.transaction_type,
        ),
        "notes": case.notes,
        "outcome_type": case.outcome_type,
        "closure_notes": case.closure_notes,
        "closure_summary": case.closure_summary,
        "estimated_amount_protected": case.estimated_amount_protected,
        "estimated_amount_lost": case.estimated_amount_lost,
        "trusted_contact_engaged": case.trusted_contact_engaged,
        "fraud_ops_involved": case.fraud_ops_involved,
        "follow_up_required": case.follow_up_required,
        "closed_at": case.closed_at.isoformat() if case.closed_at else None,
        "action_logs": serialize_action_logs(db, case.id),
    }


@router.get("/", response_model=list[ScamCaseResponse], summary="List Cases", dependencies=[VIEW_CASES])
def list_scam_cases():
    db: Session = SessionLocal()

    try:
        cases = db.query(ScamCase).all()

        status_order = {"New": 0, "In Review": 1, "Escalated": 2, "Closed": 3}
        urgency_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}

        cases = sorted(
            cases,
            key=lambda case: (
                status_order.get(case.status, 99),
                urgency_order.get(case.urgency, 99),
                -(case.id or 0),
            ),
        )
        return [serialize_case(db, case) for case in cases]
    finally:
        db.close()


@router.get("/summary", summary="Get Case Summary", dependencies=[VIEW_REPORTING])
def get_scam_case_summary():
    db: Session = SessionLocal()

    try:
        cases = db.query(ScamCase).all()

        total_cases = len(cases)
        open_cases = sum(1 for case in cases if case.status != "Closed")
        closed_cases = sum(1 for case in cases if case.status == "Closed")

        source_unit_counts = {}
        outcome_counts = {}

        protected_or_blocked = 0
        funds_lost = 0

        for case in cases:
            source_unit = case.source_unit or "Unknown"
            source_unit_counts[source_unit] = source_unit_counts.get(source_unit, 0) + 1

            outcome = case.outcome_type or "unset"
            outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1

            if outcome in {"customer_protected", "funds_blocked"}:
                protected_or_blocked += 1
            elif outcome == "funds_lost":
                funds_lost += 1

        return {
            "total_cases": total_cases,
            "open_cases": open_cases,
            "closed_cases": closed_cases,
            "protected_or_blocked_cases": protected_or_blocked,
            "funds_lost_cases": funds_lost,
            "source_unit_counts": source_unit_counts,
            "outcome_counts": outcome_counts,
        }
    finally:
        db.close()


@router.post("/", response_model=ScamCaseResponse, summary="Create Case", dependencies=[WRITE_RATE_LIMIT, CREATE_INTAKE])
@router.post("/intake", response_model=ScamCaseResponse, summary="Create Intake Case", dependencies=[WRITE_RATE_LIMIT, CREATE_INTAKE])
def create_scam_case(payload: ScamCaseIntakeRequest, current_user: User = Depends(require_permission(Permission.create_intake))):
    db: Session = SessionLocal()

    try:
        artifacts = build_case_artifacts(payload)

        scam_case = ScamCase(
            case_id=f"CASE-{uuid4().hex[:8].upper()}",
            status="New",
            urgency=artifacts["urgency"],
            urgency_score=artifacts["urgency_score"],
            scam_type=artifacts["scam_type"],
            title=artifacts["title"],
            summary=artifacts["summary"],
            customer_identifier=payload.customer_identifier,
            full_name=payload.full_name,
            age_band=payload.age_band,
            vulnerable_adult_flag=payload.vulnerable_adult_flag,
            source_unit=payload.source_unit,
            assigned_owner=None,
            assigned_team=None,
            trusted_contact_exists=payload.trusted_contact_exists,
            trusted_contact_name=payload.trusted_contact_name,
            trusted_contact_phone=payload.trusted_contact_phone,
            intake_channel=payload.intake_channel,
            transaction_type=payload.transaction_type,
            amount_at_risk=payload.amount_at_risk,
            money_already_left=payload.money_already_left,
            customer_currently_on_call_with_scammer=payload.customer_currently_on_call_with_scammer,
            new_payee_or_destination=payload.new_payee_or_destination,
            customer_told_to_keep_secret=payload.customer_told_to_keep_secret,
            narrative=payload.narrative,
            risk_factors_json=json.dumps(artifacts["risk_factors"]),
            urgency_reasons_json=json.dumps(artifacts["urgency_reasons"]),
            playbook_json=json.dumps(artifacts["playbook"]),
            notes="",
            outcome_type=None,
            closure_notes=None,
        )

        db.add(scam_case)
        db.commit()
        db.refresh(scam_case)

        write_action_log(
            db,
            scam_case.id,
            "case_created",
            f"Case created from {scam_case.source_unit} with {scam_case.urgency} urgency and scam type {scam_case.scam_type}.",
            current_user,
        )

        return serialize_case(db, scam_case)
    finally:
        db.close()


def build_seed_case(db: Session, seed: dict, actor: Optional[User] = None) -> ScamCase:
    payload = ScamCaseIntakeRequest(**seed["intake"])
    artifacts = build_case_artifacts(payload)

    scam_case = ScamCase(
        case_id=f"CASE-{uuid4().hex[:8].upper()}",
        status="New",
        urgency=artifacts["urgency"],
        urgency_score=artifacts["urgency_score"],
        scam_type=artifacts["scam_type"],
        title=artifacts["title"],
        summary=artifacts["summary"],
        customer_identifier=payload.customer_identifier,
        full_name=payload.full_name,
        age_band=payload.age_band,
        vulnerable_adult_flag=payload.vulnerable_adult_flag,
        source_unit=payload.source_unit,
        assigned_owner=seed.get("assigned_owner"),
        assigned_team=seed.get("assigned_team"),
        trusted_contact_exists=payload.trusted_contact_exists,
        trusted_contact_name=payload.trusted_contact_name,
        trusted_contact_phone=payload.trusted_contact_phone,
        intake_channel=payload.intake_channel,
        transaction_type=payload.transaction_type,
        amount_at_risk=payload.amount_at_risk,
        money_already_left=payload.money_already_left,
        customer_currently_on_call_with_scammer=payload.customer_currently_on_call_with_scammer,
        new_payee_or_destination=payload.new_payee_or_destination,
        customer_told_to_keep_secret=payload.customer_told_to_keep_secret,
        narrative=payload.narrative,
        risk_factors_json=json.dumps(artifacts["risk_factors"]),
        urgency_reasons_json=json.dumps(artifacts["urgency_reasons"]),
        playbook_json=json.dumps(artifacts["playbook"]),
        notes=seed.get("notes", ""),
        outcome_type=None,
        closure_notes=None,
    )

    db.add(scam_case)
    db.commit()
    db.refresh(scam_case)

    write_action_log(
        db,
        scam_case.id,
        "case_created",
        f"Curated demo case seeded from {scam_case.source_unit} with {scam_case.urgency} urgency.",
        actor,
    )

    if scam_case.assigned_owner or scam_case.assigned_team:
        owner_text = scam_case.assigned_owner or "Unassigned owner"
        team_text = scam_case.assigned_team or "Unassigned team"
        write_action_log(
            db,
            scam_case.id,
            "assignment_updated",
            f"Assignment updated to owner: {owner_text}; team: {team_text}.",
            actor,
        )

    closure = seed.get("closure")
    target_status = seed.get("status", "New")
    if target_status != "New" and not closure:
        scam_case.status = target_status
        db.commit()
        db.refresh(scam_case)
        write_action_log(
            db,
            scam_case.id,
            "status_changed",
            f"Status changed from New to {scam_case.status}.",
            actor,
        )

    for step in seed.get("playbook_completed", []):
        write_action_log(
            db,
            scam_case.id,
            "playbook_step_completed",
            f"Playbook step completed: {step}.",
            actor,
        )

    for step in seed.get("playbook_skipped", []):
        write_action_log(
            db,
            scam_case.id,
            "playbook_step_skipped",
            f"Playbook step skipped: {step}.",
            actor,
        )

    for action_type, details in seed.get("history", []):
        write_action_log(db, scam_case.id, action_type, details, actor)

    if closure:
        scam_case.status = "Closed"
        scam_case.outcome_type = closure["outcome_type"]
        scam_case.closure_summary = closure["closure_summary"]
        scam_case.closure_notes = closure["closure_summary"]
        scam_case.estimated_amount_protected = closure.get("estimated_amount_protected")
        scam_case.estimated_amount_lost = closure.get("estimated_amount_lost")
        scam_case.trusted_contact_engaged = closure.get("trusted_contact_engaged", False)
        scam_case.fraud_ops_involved = closure.get("fraud_ops_involved", False)
        scam_case.follow_up_required = closure.get("follow_up_required", False)
        scam_case.closed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(scam_case)

        outcome_label = OUTCOME_LABELS.get(scam_case.outcome_type or "", scam_case.outcome_type or "Other")
        amount_details = []
        if scam_case.estimated_amount_protected:
            amount_details.append(f"Estimated protected amount: ${scam_case.estimated_amount_protected:,.2f}.")
        if scam_case.estimated_amount_lost:
            amount_details.append(f"Estimated lost amount: ${scam_case.estimated_amount_lost:,.2f}.")
        if scam_case.follow_up_required:
            amount_details.append("Follow-up required.")

        write_action_log(
            db,
            scam_case.id,
            "case_closed",
            " ".join(
                [
                    f"Case closed with outcome: {outcome_label}.",
                    *amount_details,
                    f"Summary: {scam_case.closure_summary}",
                ]
            ),
            actor,
        )

    return scam_case


@router.post("/reset-demo-data", summary="Reset Demo Data", dependencies=[ADMIN_RATE_LIMIT, MANAGE_DEMO_DATA])
def reset_demo_data(current_user: User = Depends(require_permission(Permission.manage_demo_data))):
    db: Session = SessionLocal()

    try:
        deleted_logs = db.query(ActionLog).delete()
        deleted_cases = db.query(ScamCase).delete()
        db.commit()

        write_system_audit_log(
            db,
            "demo_data_reset",
            f"Reset demo data. Deleted {deleted_cases} cases and {deleted_logs} case action logs.",
            actor_email=current_user.email,
            actor_role=current_user.role,
            resource_type="demo_data",
        )

        return {"deleted_cases": deleted_cases, "deleted_action_logs": deleted_logs}
    finally:
        db.close()


@router.post("/seed-demo-data", summary="Seed Demo Data", dependencies=[ADMIN_RATE_LIMIT, MANAGE_DEMO_DATA])
def seed_demo_data(current_user: User = Depends(require_permission(Permission.manage_demo_data))):
    db: Session = SessionLocal()

    try:
        deleted_logs = db.query(ActionLog).delete()
        deleted_cases = db.query(ScamCase).delete()
        db.commit()

        seeded = [build_seed_case(db, seed, current_user) for seed in DEMO_CASES]

        write_system_audit_log(
            db,
            "demo_data_seeded",
            f"Seeded {len(seeded)} curated demo cases after deleting {deleted_cases} existing cases.",
            actor_email=current_user.email,
            actor_role=current_user.role,
            resource_type="demo_data",
        )

        return {
            "seeded_cases": len(seeded),
            "deleted_cases": deleted_cases,
            "deleted_action_logs": deleted_logs,
        }
    finally:
        db.close()


@router.delete("/{case_id}", summary="Delete Case", dependencies=[ADMIN_RATE_LIMIT, MANAGE_DEMO_DATA])
def delete_scam_case(case_id: int, current_user: User = Depends(require_permission(Permission.manage_demo_data))):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        case_reference = case.case_id
        db.query(ActionLog).filter(ActionLog.scam_case_id == case.id).delete()
        db.delete(case)
        db.commit()

        write_system_audit_log(
            db,
            "case_deleted",
            f"Deleted case {case_reference}.",
            actor_email=current_user.email,
            actor_role=current_user.role,
            resource_type="case",
            resource_id=str(case_id),
        )

        return {"id": case_id, "deleted": True}
    finally:
        db.close()


@router.post("/{case_id}/actions", response_model=ScamCaseResponse, summary="Record Case Action", dependencies=[WRITE_RATE_LIMIT, UPDATE_CASE])
def record_case_action(case_id: int, payload: CaseActionUpdate, current_user: User = Depends(require_permission(Permission.update_case))):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        changes = []

        if payload.status is not None and payload.status != case.status:
            changes.append(f"status {case.status} -> {payload.status}")
            case.status = payload.status

        if (
            payload.assigned_owner is not None
            or payload.assigned_team is not None
        ) and (payload.assigned_owner != case.assigned_owner or payload.assigned_team != case.assigned_team):
            case.assigned_owner = payload.assigned_owner
            case.assigned_team = payload.assigned_team
            owner_text = payload.assigned_owner or "Unassigned owner"
            team_text = payload.assigned_team or "Unassigned team"
            changes.append(f"assignment owner: {owner_text}; team: {team_text}")

        if payload.notes is not None and payload.notes != case.notes:
            case.notes = payload.notes
            changes.append("operator notes updated")

        if payload.money_already_left is not None and payload.money_already_left != case.money_already_left:
            case.money_already_left = payload.money_already_left
            changes.append(f"funds already left set to {payload.money_already_left}")

        if payload.outcome_type is not None and payload.outcome_type != case.outcome_type:
            case.outcome_type = payload.outcome_type
            changes.append(f"outcome set to {payload.outcome_type}")

        if payload.closure_notes is not None and payload.closure_notes != case.closure_notes:
            case.closure_notes = payload.closure_notes
            changes.append("closure notes updated")

        db.commit()
        db.refresh(case)

        detail_parts = [payload.details or payload.label]
        if changes:
            detail_parts.append("Updates: " + "; ".join(changes) + ".")

        write_action_log(
            db,
            case.id,
            payload.action_type,
            " ".join(detail_parts),
            current_user,
        )
        return serialize_case(db, case)
    finally:
        db.close()


@router.get("/{case_id}", response_model=ScamCaseResponse, summary="Get Case", dependencies=[VIEW_CASES])
def get_scam_case(case_id: int):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        return serialize_case(db, case)
    finally:
        db.close()


@router.put("/{case_id}/status", response_model=ScamCaseResponse, summary="Update Case Status", dependencies=[WRITE_RATE_LIMIT, UPDATE_CASE])
def update_scam_case_status(case_id: int, payload: CaseStatusUpdate, current_user: User = Depends(require_permission(Permission.update_case))):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        old_status = case.status
        if old_status == payload.status:
            return serialize_case(db, case)

        case.status = payload.status
        db.commit()
        db.refresh(case)

        write_action_log(
            db,
            case.id,
            "status_changed",
            f"Status changed from {old_status} to {case.status}.",
            current_user,
        )
        return serialize_case(db, case)
    finally:
        db.close()


@router.put("/{case_id}/notes", response_model=ScamCaseResponse, summary="Update Case Notes", dependencies=[WRITE_RATE_LIMIT, UPDATE_CASE])
def update_scam_case_notes(case_id: int, payload: CaseNotesUpdate, current_user: User = Depends(require_permission(Permission.update_case))):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        if case.notes == payload.notes:
            return serialize_case(db, case)

        case.notes = payload.notes
        db.commit()
        db.refresh(case)

        preview = payload.notes.strip()[:120] if payload.notes.strip() else "Notes cleared."
        write_action_log(
            db,
            case.id,
            "notes_updated",
            preview,
            current_user,
        )
        return serialize_case(db, case)
    finally:
        db.close()


@router.put("/{case_id}/assignment", response_model=ScamCaseResponse, summary="Update Case Assignment", dependencies=[WRITE_RATE_LIMIT, UPDATE_CASE])
def update_scam_case_assignment(case_id: int, payload: CaseAssignmentUpdate, current_user: User = Depends(require_permission(Permission.update_case))):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        old_owner = case.assigned_owner
        old_team = case.assigned_team
        if old_owner == payload.assigned_owner and old_team == payload.assigned_team:
            return serialize_case(db, case)

        case.assigned_owner = payload.assigned_owner
        case.assigned_team = payload.assigned_team
        db.commit()
        db.refresh(case)

        owner_text = case.assigned_owner or "Unassigned owner"
        team_text = case.assigned_team or "Unassigned team"

        write_action_log(
            db,
            case.id,
            "assignment_updated",
            f"Assignment updated to owner: {owner_text}; team: {team_text}.",
            current_user,
        )
        return serialize_case(db, case)
    finally:
        db.close()


@router.put("/{case_id}/close", response_model=ScamCaseResponse, summary="Close Case", dependencies=[WRITE_RATE_LIMIT, CLOSE_CASE])
def close_scam_case(case_id: int, payload: CaseCloseUpdate, current_user: User = Depends(require_permission(Permission.close_case))):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        case.status = "Closed"
        case.outcome_type = payload.outcome_type
        case.closure_summary = payload.closure_summary
        case.closure_notes = payload.closure_notes or payload.closure_summary
        case.estimated_amount_protected = payload.estimated_amount_protected
        case.estimated_amount_lost = payload.estimated_amount_lost
        case.trusted_contact_engaged = payload.trusted_contact_engaged
        case.fraud_ops_involved = payload.fraud_ops_involved
        case.follow_up_required = payload.follow_up_required
        case.closed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(case)

        outcome_label = OUTCOME_LABELS.get(case.outcome_type or "", case.outcome_type or "Other")
        amount_details = []
        if case.estimated_amount_protected:
            amount_details.append(f"Estimated protected amount: ${case.estimated_amount_protected:,.2f}.")
        if case.estimated_amount_lost:
            amount_details.append(f"Estimated lost amount: ${case.estimated_amount_lost:,.2f}.")
        if case.follow_up_required:
            amount_details.append("Follow-up required.")

        write_action_log(
            db,
            case.id,
            "case_closed",
            " ".join(
                [
                    f"Case closed with outcome: {outcome_label}.",
                    *amount_details,
                    f"Summary: {case.closure_summary}",
                ]
            ),
            current_user,
        )
        return serialize_case(db, case)
    finally:
        db.close()
