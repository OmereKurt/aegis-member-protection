import pytest
from fastapi import HTTPException

from app.core.auth import (
    DEFAULT_JWT_SECRET,
    MIN_PRODUCTION_SECRET_LENGTH,
    NON_PRODUCTION_ENVIRONMENTS,
    validate_jwt_secret,
)
from app.core.security import AegisRole, InMemoryRateLimiter, Permission, role_has_permission
from test_api import client, csrf_headers, login_as, reset_cases


def test_security_headers_are_present():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]


def test_invalid_amount_payload_is_rejected():
    login_as("branch@aegis.local")
    response = client.post(
        "/api/scam-cases/",
        json={
            "customer_identifier": "TEST-NEGATIVE",
            "age_band": "70_79",
            "source_unit": "Contact Center",
            "intake_channel": "phone",
            "transaction_type": "wire",
            "amount_at_risk": -1,
            "narrative": "Invalid test payload.",
        },
        headers=csrf_headers(),
    )

    assert response.status_code == 422


def test_role_permission_scaffolding_for_future_rbac():
    assert role_has_permission(AegisRole.branch_user, Permission.create_intake)
    assert role_has_permission(AegisRole.fraud_analyst, Permission.create_intake)
    assert not role_has_permission(AegisRole.branch_user, Permission.manage_demo_data)
    assert role_has_permission(AegisRole.fraud_analyst, Permission.close_case)
    assert role_has_permission(AegisRole.manager, Permission.view_reporting)
    assert role_has_permission(AegisRole.admin, Permission.manage_demo_data)


def test_rate_limiter_raises_after_limit():
    limiter = InMemoryRateLimiter()
    limiter.check("test-client", limit=2, window_seconds=60)
    limiter.check("test-client", limit=2, window_seconds=60)

    try:
        limiter.check("test-client", limit=2, window_seconds=60)
    except HTTPException as exc:
        assert exc.status_code == 429
    else:
        raise AssertionError("Expected rate limiter to raise HTTP 429")


def test_login_failure_and_current_user():
    client.cookies.clear()
    failed = client.post(
        "/api/auth/login",
        json={"email": "branch@aegis.local", "password": "wrong-password"},
    )
    assert failed.status_code == 401

    user = login_as("branch@aegis.local")
    assert user["role"] == "branch_user"

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["user"]["email"] == "branch@aegis.local"


def test_unauthenticated_user_is_blocked_from_cases():
    client.cookies.clear()

    response = client.get("/api/scam-cases/")

    assert response.status_code == 401


def test_branch_user_cannot_reset_demo_data():
    login_as("branch@aegis.local")

    response = client.post("/api/scam-cases/reset-demo-data", headers=csrf_headers())

    assert response.status_code == 403


def test_branch_user_cannot_close_seed_or_delete_cases():
    reset_cases()
    login_as("admin@aegis.local")
    seed = client.post("/api/scam-cases/seed-demo-data", headers=csrf_headers())
    assert seed.status_code == 200
    case_id = client.get("/api/scam-cases/").json()[0]["id"]

    login_as("branch@aegis.local")
    close_response = client.put(
        f"/api/scam-cases/{case_id}/close",
        json={
            "outcome_type": "member_protected",
            "closure_summary": "Branch user should not close cases.",
            "follow_up_required": False,
        },
        headers=csrf_headers(),
    )
    assert close_response.status_code == 403

    seed_response = client.post("/api/scam-cases/seed-demo-data", headers=csrf_headers())
    assert seed_response.status_code == 403

    delete_response = client.delete(f"/api/scam-cases/{case_id}", headers=csrf_headers())
    assert delete_response.status_code == 403


def test_unsafe_request_requires_csrf_token():
    login_as("branch@aegis.local")

    response = client.post(
        "/api/scam-cases/",
        json={
            "customer_identifier": "TEST-CSRF",
            "age_band": "70_79",
            "source_unit": "Contact Center",
            "intake_channel": "phone",
            "transaction_type": "wire",
            "amount_at_risk": 100,
            "narrative": "Missing CSRF token should be rejected.",
        },
    )

    assert response.status_code == 403


def test_fraud_analyst_can_update_and_close_case():
    reset_cases()
    login_as("branch@aegis.local")
    created = client.post(
        "/api/scam-cases/",
        json={
            "customer_identifier": "TEST-FRAUD-RBAC",
            "age_band": "70_79",
            "source_unit": "Contact Center",
            "intake_channel": "phone",
            "transaction_type": "wire",
            "amount_at_risk": 5000,
            "narrative": "Member reported suspected exploitation.",
        },
        headers=csrf_headers(),
    ).json()

    login_as("fraud@aegis.local")
    update_response = client.put(
        f"/api/scam-cases/{created['id']}/status",
        json={"status": "In Review"},
        headers=csrf_headers(),
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "In Review"

    close_response = client.put(
        f"/api/scam-cases/{created['id']}/close",
        json={
            "outcome_type": "member_protected",
            "closure_summary": "Member intent verified and case closed.",
            "follow_up_required": False,
            "trusted_contact_engaged": False,
            "fraud_ops_involved": True,
        },
        headers=csrf_headers(),
    )
    assert close_response.status_code == 200
    assert close_response.json()["status"] == "Closed"


def test_fraud_analyst_cannot_seed_reset_or_delete():
    reset_cases()
    login_as("admin@aegis.local")
    seed = client.post("/api/scam-cases/seed-demo-data", headers=csrf_headers())
    assert seed.status_code == 200
    case_id = client.get("/api/scam-cases/").json()[0]["id"]

    login_as("fraud@aegis.local")
    assert client.post("/api/scam-cases/seed-demo-data", headers=csrf_headers()).status_code == 403
    assert client.post("/api/scam-cases/reset-demo-data", headers=csrf_headers()).status_code == 403
    assert client.delete(f"/api/scam-cases/{case_id}", headers=csrf_headers()).status_code == 403


def test_manager_can_view_but_cannot_mutate_cases():
    reset_cases()
    login_as("admin@aegis.local")
    seed = client.post("/api/scam-cases/seed-demo-data", headers=csrf_headers())
    assert seed.status_code == 200

    login_as("manager@aegis.local")
    list_response = client.get("/api/scam-cases/")
    assert list_response.status_code == 200
    case_id = list_response.json()[0]["id"]

    update_response = client.put(
        f"/api/scam-cases/{case_id}/status",
        json={"status": "In Review"},
        headers=csrf_headers(),
    )
    assert update_response.status_code == 403

    close_response = client.put(
        f"/api/scam-cases/{case_id}/close",
        json={
            "outcome_type": "member_protected",
            "closure_summary": "Manager should not close cases.",
            "follow_up_required": False,
        },
        headers=csrf_headers(),
    )
    assert close_response.status_code == 403

    assert client.delete(f"/api/scam-cases/{case_id}", headers=csrf_headers()).status_code == 403
    assert client.post("/api/scam-cases/seed-demo-data", headers=csrf_headers()).status_code == 403
    assert client.post("/api/scam-cases/reset-demo-data", headers=csrf_headers()).status_code == 403


def test_admin_can_seed_reset_and_delete_cases():
    reset_cases()
    login_as("admin@aegis.local")

    seed_response = client.post("/api/scam-cases/seed-demo-data", headers=csrf_headers())
    assert seed_response.status_code == 200

    cases = client.get("/api/scam-cases/").json()
    delete_response = client.delete(f"/api/scam-cases/{cases[0]['id']}", headers=csrf_headers())
    assert delete_response.status_code == 200

    reset_response = client.post("/api/scam-cases/reset-demo-data", headers=csrf_headers())
    assert reset_response.status_code == 200


def test_admin_can_view_system_audit_logs():
    reset_cases()
    login_as("admin@aegis.local")
    seed_response = client.post("/api/scam-cases/seed-demo-data", headers=csrf_headers())
    assert seed_response.status_code == 200

    audit_response = client.get("/api/audit/system")
    assert audit_response.status_code == 200
    logs = audit_response.json()
    assert logs
    assert logs[0]["actor_email"] == "admin@aegis.local"


def test_non_admin_cannot_view_system_audit_logs():
    login_as("manager@aegis.local")

    response = client.get("/api/audit/system")

    assert response.status_code == 403


def test_default_jwt_secret_is_rejected_in_production():
    with pytest.raises(RuntimeError) as excinfo:
        validate_jwt_secret("production", DEFAULT_JWT_SECRET)

    assert "JWT_SECRET" in str(excinfo.value)


def test_short_jwt_secret_is_rejected_in_production():
    with pytest.raises(RuntimeError) as excinfo:
        validate_jwt_secret("production", "x" * (MIN_PRODUCTION_SECRET_LENGTH - 1))

    assert str(MIN_PRODUCTION_SECRET_LENGTH) in str(excinfo.value)


def test_strong_jwt_secret_is_accepted_in_production():
    validate_jwt_secret("production", "x" * MIN_PRODUCTION_SECRET_LENGTH)


def test_unrecognised_environment_is_treated_as_production():
    # Anything not explicitly a dev environment must fail closed, so that a
    # typo like ENVIRONMENT=prodution does not silently disable the guard.
    with pytest.raises(RuntimeError):
        validate_jwt_secret("prodution", DEFAULT_JWT_SECRET)


def test_default_jwt_secret_is_allowed_in_non_production_environments():
    for environment in NON_PRODUCTION_ENVIRONMENTS:
        validate_jwt_secret(environment, DEFAULT_JWT_SECRET)


def test_environment_matching_is_case_and_whitespace_insensitive_at_import():
    # ENVIRONMENT is normalised before it reaches the guard; confirm the guard
    # itself is strict so the normalisation stays the single place that decides.
    with pytest.raises(RuntimeError):
        validate_jwt_secret("Development", DEFAULT_JWT_SECRET)
