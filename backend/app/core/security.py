from collections import defaultdict, deque
from enum import Enum
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
}

DOCS_CONTENT_SECURITY_POLICY = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "img-src 'self' data: https://fastapi.tiangolo.com; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "object-src 'none'"
)


def security_headers_for_path(path: str) -> dict[str, str]:
    headers = dict(SECURITY_HEADERS)
    if path.startswith(("/docs", "/redoc")):
        headers["Content-Security-Policy"] = DOCS_CONTENT_SECURITY_POLICY
    return headers


class AegisRole(str, Enum):
    branch_user = "branch_user"
    fraud_analyst = "fraud_analyst"
    manager = "manager"
    admin = "admin"


class Permission(str, Enum):
    create_intake = "create_intake"
    update_case = "update_case"
    close_case = "close_case"
    view_reporting = "view_reporting"
    manage_demo_data = "manage_demo_data"


ROLE_PERMISSIONS: dict[AegisRole, set[Permission]] = {
    AegisRole.branch_user: {Permission.create_intake},
    AegisRole.fraud_analyst: {Permission.update_case, Permission.close_case},
    AegisRole.manager: {Permission.view_reporting},
    AegisRole.admin: set(Permission),
}


def role_has_permission(role: AegisRole, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())


class InMemoryRateLimiter:
    def __init__(self):
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = monotonic()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._requests[key]
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            if len(timestamps) >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please wait before trying again.",
                    headers={"Retry-After": str(window_seconds)},
                )

            timestamps.append(now)


rate_limiter = InMemoryRateLimiter()


def rate_limit(scope: str, limit: int = 30, window_seconds: int = 60):
    def dependency(request: Request) -> None:
        client = request.client.host if request.client else "unknown"
        rate_limiter.check(f"{scope}:{client}", limit, window_seconds)

    return dependency
