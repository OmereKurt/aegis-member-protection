import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.case import Case

router = APIRouter()


class CaseStatusUpdate(BaseModel):
    status: str


class CaseNotesUpdate(BaseModel):
    notes: str


@router.get("/api/cases")
def list_cases():
    db: Session = SessionLocal()

    try:
        cases = db.query(Case).order_by(Case.created_at.desc(), Case.id.desc()).all()

        results = []
        for case in cases:
            results.append({
                "id": case.id,
                "alert_id": case.alert_id,
                "title": case.title,
                "severity": case.severity,
                "score": case.score,
                "status": case.status,
                "notes": case.notes,
                "summary": case.summary,
                "created_at": case.created_at.isoformat() if case.created_at else None
            })

        return results
    finally:
        db.close()


@router.get("/api/cases/{case_id}")
def get_case(case_id: int):
    db: Session = SessionLocal()

    try:
        case = db.query(Case).filter(Case.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        return {
            "id": case.id,
            "alert_id": case.alert_id,
            "source": case.source,
            "alert_type": case.alert_type,
            "title": case.title,
            "severity": case.severity,
            "score": case.score,
            "status": case.status,
            "notes": case.notes,
            "summary": case.summary,
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "reasons": json.loads(case.reasons_json),
            "recommended_actions": json.loads(case.recommended_actions_json),
            "normalized_alert": json.loads(case.normalized_alert_json),
            "enrichment": json.loads(case.enrichment_json)
        }
    finally:
        db.close()


@router.put("/api/cases/{case_id}/status")
def update_case_status(case_id: int, payload: CaseStatusUpdate):
    db: Session = SessionLocal()

    try:
        case = db.query(Case).filter(Case.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        allowed_statuses = {"New", "In Review", "Closed"}
        if payload.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")

        case.status = payload.status
        db.commit()
        db.refresh(case)

        return {
            "id": case.id,
            "status": case.status
        }
    finally:
        db.close()


@router.put("/api/cases/{case_id}/notes")
def update_case_notes(case_id: int, payload: CaseNotesUpdate):
    db: Session = SessionLocal()

    try:
        case = db.query(Case).filter(Case.id == case_id).first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        case.notes = payload.notes
        db.commit()
        db.refresh(case)

        return {
            "id": case.id,
            "notes": case.notes
        }
    finally:
        db.close()
