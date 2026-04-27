from fastapi import HTTPException

from app.core.security import AegisRole, InMemoryRateLimiter, Permission, role_has_permission
from test_api import client


def test_security_headers_are_present():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]


def test_invalid_amount_payload_is_rejected():
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
