import atexit
import os
import sys
import tempfile
from pathlib import Path
from uuid import uuid4

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

TEST_DB_PATH = Path(tempfile.gettempdir()) / f"aegis_test_{uuid4().hex}.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
os.environ.setdefault("ENVIRONMENT", "test")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


client = TestClient(app)


@atexit.register
def remove_test_database():
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


def reset_cases():
    response = client.post("/api/scam-cases/reset-demo-data")
    assert response.status_code == 200


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_cases_starts_empty_after_reset():
    reset_cases()

    response = client.get("/api/scam-cases/")

    assert response.status_code == 200
    assert response.json() == []


def test_create_case_and_list_cases():
    reset_cases()

    payload = {
        "customer_identifier": "TEST-1001",
        "full_name": "Test Member",
        "age_band": "70_79",
        "vulnerable_adult_flag": True,
        "source_unit": "Contact Center",
        "trusted_contact_exists": True,
        "trusted_contact_name": "Trusted Contact",
        "trusted_contact_phone": "555-0100",
        "intake_channel": "phone",
        "transaction_type": "wire",
        "amount_at_risk": 12500,
        "money_already_left": False,
        "customer_currently_on_call_with_scammer": True,
        "new_payee_or_destination": True,
        "customer_told_to_keep_secret": True,
        "narrative": "Member reported an urgent wire request from a caller claiming to be a government agency.",
        "phone_based_imposter_story": True,
        "government_or_bank_brand_impersonation": True,
        "fear_or_urgency_language": True,
        "secrecy_pressure": True,
        "high_dollar_amount": True,
        "older_or_vulnerable_customer": True,
    }

    create_response = client.post("/api/scam-cases/", json=payload)
    assert create_response.status_code == 200

    created = create_response.json()
    assert created["id"]
    assert created["case_id"].startswith("CASE-")
    assert created["customer_identifier"] == "TEST-1001"
    assert created["case_intelligence"]["likely_pattern"]
    assert created["action_logs"]

    list_response = client.get("/api/scam-cases/")
    assert list_response.status_code == 200
    records = list_response.json()
    assert len(records) == 1
    assert records[0]["id"] == created["id"]


def test_seed_demo_data_endpoint():
    reset_cases()

    seed_response = client.post("/api/scam-cases/seed-demo-data")
    assert seed_response.status_code == 200
    seed_result = seed_response.json()
    assert seed_result["seeded_cases"] >= 8

    list_response = client.get("/api/scam-cases/")
    assert list_response.status_code == 200
    records = list_response.json()
    assert len(records) == seed_result["seeded_cases"]
    assert any(record["status"] == "Closed" for record in records)
    assert any(record["action_logs"] for record in records)
