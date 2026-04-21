import json

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.case import Case
from app.schemas.alert import AlertWrapper
from app.schemas.case import CaseAnalysisResponse
from app.services.enrich import enrich_domain, enrich_ip
from app.services.normalize import (
    normalize_phishing_email_alert,
    normalize_suspicious_login_alert,
)
from app.services.score import score_phishing_email, score_suspicious_login
from app.services.summarize import generate_summary

router = APIRouter()


@router.post("/api/alerts/analyze", response_model=CaseAnalysisResponse)
def analyze_alert(payload: AlertWrapper):
    db: Session = SessionLocal()

    try:
        if payload.alert_type == "suspicious_login":
            if payload.suspicious_login is None:
                raise HTTPException(status_code=400, detail="Missing suspicious_login payload")

            raw_alert = payload.suspicious_login

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

        elif payload.alert_type == "phishing_email":
            if payload.phishing_email is None:
                raise HTTPException(status_code=400, detail="Missing phishing_email payload")

            raw_alert = payload.phishing_email

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

            normalized_alert = normalize_phishing_email_alert(raw_alert)
            enrichment = enrich_domain(
                domain=raw_alert.sender_domain,
                newly_registered_domain=raw_alert.newly_registered_domain
            )
            score_result = score_phishing_email(normalized_alert)

        else:
            raise HTTPException(status_code=400, detail="Unsupported alert type")

        summary_result = generate_summary(normalized_alert, score_result, enrichment)

        db_case = Case(
            alert_id=normalized_alert["alert_id"],
            source=normalized_alert["source"],
            alert_type=normalized_alert["alert_type"],
            title=normalized_alert["title"],
            severity=score_result["severity"],
            score=score_result["score"],
            status="New",
            notes="",
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
