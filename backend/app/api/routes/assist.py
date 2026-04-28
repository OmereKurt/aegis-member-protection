from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.scam_cases import serialize_case, write_action_log
from app.core.auth import require_permission
from app.core.database import SessionLocal
from app.core.security import Permission, rate_limit
from app.models.scam_case import ScamCase
from app.models.user import User
from app.schemas.assist import AssistRequest, AssistResponse
from app.services.ai_assist import (
    ASSIST_DISCLAIMER,
    assist_source_fields,
    get_assist_provider,
    get_assist_settings,
)


router = APIRouter(prefix="/api/assist", tags=["assist"])

ASSIST_RATE_LIMIT = Depends(rate_limit("assist", limit=60, window_seconds=60))
VIEW_CASES = Depends(require_permission(Permission.view_cases))
UPDATE_CASE = Depends(require_permission(Permission.update_case))


def _load_case_context(db: Session, case_id: int) -> tuple[ScamCase, dict]:
    case = db.query(ScamCase).filter(ScamCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case, serialize_case(db, case)


def _ensure_enabled():
    settings = get_assist_settings()
    if not settings.enabled:
        raise HTTPException(status_code=503, detail="Aegis Assist is disabled.")
    return settings


def _response(assist_type: str, draft: str, provider: str) -> AssistResponse:
    return AssistResponse(
        assist_type=assist_type,
        draft=draft,
        disclaimer=ASSIST_DISCLAIMER,
        source_fields=assist_source_fields(assist_type),
        provider=provider,
    )


def _log_assist_generation(db: Session, case_id: int, assist_type: str, actor: User):
    write_action_log(
        db,
        case_id,
        "assist_draft_generated",
        f"Aegis Assist generated a {assist_type.replace('_', ' ')} draft for human review.",
        actor,
    )


@router.post(
    "/case-summary",
    response_model=AssistResponse,
    summary="Generate Case Summary Draft",
    dependencies=[ASSIST_RATE_LIMIT, VIEW_CASES],
)
def generate_case_summary(payload: AssistRequest, current_user: User = Depends(require_permission(Permission.view_cases))):
    db: Session = SessionLocal()
    try:
        settings = _ensure_enabled()
        case, context = _load_case_context(db, payload.case_id)
        provider = get_assist_provider(settings)
        draft = provider.case_summary(context)
        _log_assist_generation(db, case.id, "case_summary", current_user)
        return _response("case_summary", draft, provider.name)
    finally:
        db.close()


@router.post(
    "/operator-note",
    response_model=AssistResponse,
    summary="Draft Operator Note",
    dependencies=[ASSIST_RATE_LIMIT, UPDATE_CASE],
)
def generate_operator_note(payload: AssistRequest, current_user: User = Depends(require_permission(Permission.update_case))):
    db: Session = SessionLocal()
    try:
        settings = _ensure_enabled()
        case, context = _load_case_context(db, payload.case_id)
        provider = get_assist_provider(settings)
        draft = provider.operator_note(context)
        _log_assist_generation(db, case.id, "operator_note", current_user)
        return _response("operator_note", draft, provider.name)
    finally:
        db.close()


@router.post(
    "/playbook-explanation",
    response_model=AssistResponse,
    summary="Explain Recommended Playbook Step",
    dependencies=[ASSIST_RATE_LIMIT, UPDATE_CASE],
)
def generate_playbook_explanation(
    payload: AssistRequest,
    current_user: User = Depends(require_permission(Permission.update_case)),
):
    db: Session = SessionLocal()
    try:
        settings = _ensure_enabled()
        case, context = _load_case_context(db, payload.case_id)
        provider = get_assist_provider(settings)
        draft = provider.playbook_explanation(context, payload.recommended_step)
        _log_assist_generation(db, case.id, "playbook_explanation", current_user)
        return _response("playbook_explanation", draft, provider.name)
    finally:
        db.close()
