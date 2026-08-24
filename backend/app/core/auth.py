import base64
import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import AegisRole, Permission, role_has_permission
from app.models.user import User


DEFAULT_JWT_SECRET = "dev-only-change-me"
MIN_PRODUCTION_SECRET_LENGTH = 32

# Environments where the built-in signing key is acceptable because nothing real
# is behind it. Anything else is treated as production and must supply its own.
NON_PRODUCTION_ENVIRONMENTS = {"development", "docker", "test", "ci", "local"}

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
JWT_SECRET = os.getenv("JWT_SECRET", DEFAULT_JWT_SECRET)


def validate_jwt_secret(environment: str, secret: str) -> None:
    """
    Refuse to start in production on a signing key that is not secret.

    JWT_SECRET signs the session token and the CSRF token, so a known value
    forfeits both at once: anyone holding it can mint a session for any user
    at any role, admin included, and forge the matching CSRF token to go with
    it. A default that quietly works everywhere is exactly how that ships, so
    it fails here at import rather than depending on deployment discipline.

    Kept as a pure function of its two inputs so the failure modes can be
    tested without reimporting the module under a patched environment.
    """
    if environment in NON_PRODUCTION_ENVIRONMENTS:
        return

    if secret == DEFAULT_JWT_SECRET:
        raise RuntimeError(
            f"JWT_SECRET is still the built-in default with ENVIRONMENT={environment!r}. "
            "Set JWT_SECRET to a long random value before starting outside "
            f"{sorted(NON_PRODUCTION_ENVIRONMENTS)}. Generate one with: "
            "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )

    if len(secret) < MIN_PRODUCTION_SECRET_LENGTH:
        raise RuntimeError(
            f"JWT_SECRET is {len(secret)} characters with ENVIRONMENT={environment!r}; "
            f"at least {MIN_PRODUCTION_SECRET_LENGTH} are required. Generate one with: "
            "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )


validate_jwt_secret(ENVIRONMENT, JWT_SECRET)

SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "aegis_session")
CSRF_COOKIE_NAME = os.getenv("CSRF_COOKIE_NAME", "aegis_csrf")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
AUTH_DEMO_USERS_ENABLED = os.getenv("AUTH_DEMO_USERS_ENABLED", "true").lower() == "true"
PASSWORD_ITERATIONS = 210_000
UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
CSRF_EXEMPT_PATHS = {"/api/auth/login", "/api/auth/logout"}


DEMO_USERS = [
    ("branch@aegis.local", "Branch Operator", AegisRole.branch_user, "AegisBranch123!"),
    ("fraud@aegis.local", "Fraud Analyst", AegisRole.fraud_analyst, "AegisFraud123!"),
    ("manager@aegis.local", "Protection Manager", AegisRole.manager, "AegisManager123!"),
    ("admin@aegis.local", "Aegis Admin", AegisRole.admin, "AegisAdmin123!"),
]


def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str, salt: Optional[str] = None) -> str:
    salt = salt or secrets.token_urlsafe(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    )
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt}${_b64url_encode(digest)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_text, salt, expected = password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations_text),
        )
        return hmac.compare_digest(_b64url_encode(digest), expected)
    except (TypeError, ValueError):
        return False


def public_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "role": user.role,
    }


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
    }
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = ".".join(
        [
            _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8")),
            _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
        ]
    )
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url_encode(signature)}"


def create_csrf_token(session_token: str) -> str:
    nonce = secrets.token_urlsafe(24)
    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        f"{session_token}:{nonce}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{nonce}.{_b64url_encode(signature)}"


def verify_csrf_token(session_token: str, csrf_token: str) -> bool:
    try:
        nonce, signature = csrf_token.split(".", 1)
    except ValueError:
        return False

    expected = hmac.new(
        JWT_SECRET.encode("utf-8"),
        f"{session_token}:{nonce}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return hmac.compare_digest(_b64url_encode(expected), signature)


def csrf_required(request: Request) -> bool:
    return request.method.upper() in UNSAFE_METHODS and request.url.path not in CSRF_EXEMPT_PATHS


def validate_csrf_request(request: Request) -> None:
    if not csrf_required(request):
        return

    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_token:
        return

    csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
    csrf_header = request.headers.get("x-csrf-token")
    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")

    if not verify_csrf_token(session_token, csrf_header):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")


def decode_access_token(token: str) -> dict:
    try:
        header, payload, signature = token.split(".", 2)
    except ValueError:
        raise_auth_error()

    signing_input = f"{header}.{payload}"
    expected = hmac.new(JWT_SECRET.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
    if not hmac.compare_digest(_b64url_encode(expected), signature):
        raise_auth_error()

    try:
        data = json.loads(_b64url_decode(payload))
    except (ValueError, json.JSONDecodeError):
        raise_auth_error()

    if int(data.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
        raise_auth_error("Session expired")

    return data


def raise_auth_error(detail: str = "Authentication required"):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def get_current_user(request: Request, db: Session = Depends(db_session)) -> User:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        raise_auth_error()

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first() if user_id else None
    if not user:
        raise_auth_error()
    return user


def require_permission(permission: Permission):
    def dependency(user: User = Depends(get_current_user)) -> User:
        try:
            role = AegisRole(user.role)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")

        if not role_has_permission(role, permission):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def seed_demo_users(db: Session) -> None:
    if not AUTH_DEMO_USERS_ENABLED:
        return

    for email, display_name, role, password in DEMO_USERS:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.display_name = display_name
            existing.role = role.value
            existing.is_active = True
            continue

        db.add(
            User(
                email=email,
                display_name=display_name,
                role=role.value,
                password_hash=hash_password(password),
                is_active=True,
            )
        )

    db.commit()
