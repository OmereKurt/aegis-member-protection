from fastapi import HTTPException

from app.core.security import AegisRole, InMemoryRateLimiter, Permission, role_has_permission
from test_api import client, login_as, reset_cases


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

    response = client.post("/api/scam-cases/reset-demo-data")

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
    ).json()

    login_as("fraud@aegis.local")
    update_response = client.put(f"/api/scam-cases/{created['id']}/status", json={"status": "In Review"})
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
    )
    assert close_response.status_code == 200
    assert close_response.json()["status"] == "Closed"


def test_manager_can_view_but_cannot_mutate_cases():
    reset_cases()
    login_as("admin@aegis.local")
    seed = client.post("/api/scam-cases/seed-demo-data")
    assert seed.status_code == 200

    login_as("manager@aegis.local")
    list_response = client.get("/api/scam-cases/")
    assert list_response.status_code == 200
    case_id = list_response.json()[0]["id"]

    update_response = client.put(f"/api/scam-cases/{case_id}/status", json={"status": "In Review"})
    assert update_response.status_code == 403


def test_admin_can_seed_reset_and_delete_cases():
    reset_cases()
    login_as("admin@aegis.local")

    seed_response = client.post("/api/scam-cases/seed-demo-data")
    assert seed_response.status_code == 200

    cases = client.get("/api/scam-cases/").json()
    delete_response = client.delete(f"/api/scam-cases/{cases[0]['id']}")
    assert delete_response.status_code == 200

    reset_response = client.post("/api/scam-cases/reset-demo-data")
    assert reset_response.status_code == 200
