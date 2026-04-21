import json

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.case import Case
from app.schemas.alert import SuspiciousLoginAlert
from app.schemas.case import CaseAnalysisResponse
from app.services.enrich import enrich_ip
from app.services.normalize import normalize_suspicious_login_alert
from app.services.score import score_suspicious_login
from app.services.summarize import generate_summary

router = APIRouter()


@router.post("/api/alerts/analyze", response_model=CaseAnalysisResponse)
def analyze_alert(raw_alert: SuspiciousLoginAlert):
    db: Session = SessionLocal()

    try:
        existing_case = db.query(Case).filter(Case.alert_id == raw_alert.alert_id).first()

        if existing_case:
            return {
                "alert_id": existing_case.alert_id,
                "severity": existing_case.severity,
                "score": existing_case.score,
                "reasons": json.loads(existing_case.reasons_json),
                "summary": existing_case.summary,
                "recommended_actions": json.loads(existing_case.recommended_actions_json),
                "normalized_alert": json.loads(existing_case.normalized_alert_json),
                "enrichment": json.loads(existing_case.enrichment_json)
            }

        normalized_alert = normalize_suspicious_login_alert(raw_alert)

        enrichment = enrich_ip(
            ip=raw_alert.ip,
            country=raw_alert.country,
            city=raw_alert.city
        )

        score_result = score_suspicious_login(normalized_alert)
        summary_result = generate_summary(normalized_alert, score_result, enrichment)

        db_case = Case(
            alert_id=normalized_alert["alert_id"],
            source=normalized_alert["source"],
            alert_type=normalized_alert["alert_type"],
            title=normalized_alert["title"],
            severity=score_result["severity"],
            score=score_result["score"],
            summary=summary_result["summary"],
            reasons_json=json.dumps(score_result["reasons"]),
            recommended_actions_json=json.dumps(summary_result["recommended_actions"]),
            normalized_alert_json=json.dumps(normalized_alert),
            enrichment_json=json.dumps(enrichment)
        )

        db.add(db_case)
        db.commit()

        return {
            "alert_id": normalized_alert["alert_id"],
            "severity": score_result["severity"],
            "score": score_result["score"],
            "reasons": score_result["reasons"],
            "summary": summary_result["summary"],
            "recommended_actions": summary_result["recommended_actions"],
            "normalized_alert": normalized_alert,
            "enrichment": enrichment
        }
    finally:
        db.close()
