from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import db_session, require_permission
from app.core.security import Permission
from app.models.system_audit_log import SystemAuditLog

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/system", dependencies=[Depends(require_permission(Permission.manage_demo_data))])
def list_system_audit_logs(db: Session = Depends(db_session)):
    logs = db.query(SystemAuditLog).order_by(SystemAuditLog.created_at.desc(), SystemAuditLog.id.desc()).limit(100).all()
    return [
        {
            "id": log.id,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "action_type": log.action_type,
            "details": log.details,
            "actor_email": log.actor_email,
            "actor_role": log.actor_role,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
        }
        for log in logs
    ]
