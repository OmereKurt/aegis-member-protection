import json

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.case import Case

router = APIRouter()


@router.get("/api/cases")
def list_cases():
    db: Session = SessionLocal()

    try:
        cases = db.query(Case).all()

        results = []
        for case in cases:
            results.append({
                "id": case.id,
                "alert_id": case.alert_id,
                "title": case.title,
                "severity": case.severity,
                "score": case.score,
                "summary": case.summary
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
            "summary": case.summary,
            "reasons": json.loads(case.reasons_json),
            "recommended_actions": json.loads(case.recommended_actions_json),
            "normalized_alert": json.loads(case.normalized_alert_json),
            "enrichment": json.loads(case.enrichment_json)
        }
    finally:
        db.close()
