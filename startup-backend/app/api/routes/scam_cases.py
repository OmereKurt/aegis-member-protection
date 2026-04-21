import json
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.action_log import ActionLog
from app.models.scam_case import ScamCase
from app.schemas.scam_case import (
    CaseCloseUpdate,
    CaseNotesUpdate,
    CaseStatusUpdate,
    ScamCaseIntakeRequest,
    ScamCaseResponse,
)
from app.services.scam_case_logic import build_case_artifacts

router = APIRouter(prefix="/api/scam-cases", tags=["scam-cases"])


def write_action_log(db: Session, scam_case_id: int, action_type: str, details: str):
    log = ActionLog(
        scam_case_id=scam_case_id,
        action_type=action_type,
        details=details,
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
        }
        for log in logs
    ]


def serialize_case(db: Session, case: ScamCase) -> dict:
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
        "urgency_reasons": json.loads(case.urgency_reasons_json),
        "risk_factors": json.loads(case.risk_factors_json),
        "playbook": json.loads(case.playbook_json),
        "notes": case.notes,
        "outcome_type": case.outcome_type,
        "closure_notes": case.closure_notes,
        "action_logs": serialize_action_logs(db, case.id),
    }


@router.get("/")
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

        results = []
        for case in cases:
            results.append(
                {
                    "id": case.id,
                    "case_id": case.case_id,
                    "title": case.title,
                    "customer_identifier": case.customer_identifier,
                    "source_unit": case.source_unit,
                    "scam_type": case.scam_type,
                    "urgency": case.urgency,
                    "status": case.status,
                    "amount_at_risk": case.amount_at_risk,
                    "notes": case.notes,
                    "created_at": case.created_at.isoformat() if case.created_at else None,
                }
            )

        return results
    finally:
        db.close()


@router.post("/intake", response_model=ScamCaseResponse)
def create_scam_case(payload: ScamCaseIntakeRequest):
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
        )

        return serialize_case(db, scam_case)
    finally:
        db.close()


@router.get("/{case_id}", response_model=ScamCaseResponse)
def get_scam_case(case_id: int):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        return serialize_case(db, case)
    finally:
        db.close()


@router.put("/{case_id}/status")
def update_scam_case_status(case_id: int, payload: CaseStatusUpdate):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        old_status = case.status
        case.status = payload.status
        db.commit()
        db.refresh(case)

        write_action_log(
            db,
            case.id,
            "status_changed",
            f"Status changed from {old_status} to {case.status}.",
        )

        return {"id": case.id, "status": case.status}
    finally:
        db.close()


@router.put("/{case_id}/notes")
def update_scam_case_notes(case_id: int, payload: CaseNotesUpdate):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        case.notes = payload.notes
        db.commit()
        db.refresh(case)

        preview = payload.notes.strip()[:120] if payload.notes.strip() else "Notes cleared."
        write_action_log(
            db,
            case.id,
            "notes_updated",
            preview,
        )

        return {"id": case.id, "notes": case.notes}
    finally:
        db.close()


@router.put("/{case_id}/close")
def close_scam_case(case_id: int, payload: CaseCloseUpdate):
    db: Session = SessionLocal()

    try:
        case = db.query(ScamCase).filter(ScamCase.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        case.status = "Closed"
        case.outcome_type = payload.outcome_type
        case.closure_notes = payload.closure_notes

        db.commit()
        db.refresh(case)

        write_action_log(
            db,
            case.id,
            "case_closed",
            f"Case closed with outcome {case.outcome_type}.",
        )

        return {
            "id": case.id,
            "status": case.status,
            "outcome_type": case.outcome_type,
            "closure_notes": case.closure_notes,
        }
    finally:
        db.close()
