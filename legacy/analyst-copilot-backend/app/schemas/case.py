from typing import Any
from pydantic import BaseModel


class CaseAnalysisResponse(BaseModel):
    alert_id: str
    severity: str
    score: int
    reasons: list[str]
    summary: str
    recommended_actions: list[str]
    normalized_alert: dict[str, Any]
    enrichment: dict[str, Any]
