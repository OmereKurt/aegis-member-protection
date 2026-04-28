from test_api import client, csrf_headers, login_as, reset_cases


def create_assist_case():
    reset_cases()
    login_as("branch@aegis.local")
    response = client.post(
        "/api/scam-cases/",
        json={
            "customer_identifier": "TEST-ASSIST",
            "full_name": "Assist Member",
            "age_band": "80_plus",
            "vulnerable_adult_flag": True,
            "source_unit": "Contact Center",
            "trusted_contact_exists": True,
            "trusted_contact_name": "Trusted Person",
            "trusted_contact_phone": "555-0199",
            "intake_channel": "phone",
            "transaction_type": "wire",
            "amount_at_risk": 18000,
            "money_already_left": False,
            "customer_currently_on_call_with_scammer": True,
            "new_payee_or_destination": True,
            "customer_told_to_keep_secret": True,
            "narrative": "Member is being coached by a caller to wire funds to a new destination and keep the reason private.",
            "phone_based_imposter_story": True,
            "government_or_bank_brand_impersonation": True,
            "fear_or_urgency_language": True,
            "secrecy_pressure": True,
            "high_dollar_amount": True,
            "older_or_vulnerable_customer": True,
        },
        headers=csrf_headers(),
    )
    assert response.status_code == 200
    return response.json()


def test_unauthenticated_user_cannot_call_assist_endpoint():
    client.cookies.clear()

    response = client.post("/api/assist/case-summary", json={"case_id": 1})

    assert response.status_code == 401


def test_branch_user_cannot_generate_operator_note_draft():
    case = create_assist_case()
    login_as("branch@aegis.local")

    response = client.post(
        "/api/assist/operator-note",
        json={"case_id": case["id"]},
        headers=csrf_headers(),
    )

    assert response.status_code == 403


def test_manager_can_generate_mock_case_summary_without_api_key():
    case = create_assist_case()
    login_as("manager@aegis.local")

    response = client.post(
        "/api/assist/case-summary",
        json={"case_id": case["id"]},
        headers=csrf_headers(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["assist_type"] == "case_summary"
    assert payload["provider"] == "mock"
    assert "AI-generated draft" in payload["disclaimer"]
    assert "Assist Member" in payload["draft"]


def test_fraud_analyst_can_generate_operator_note_and_playbook_explanation():
    case = create_assist_case()
    login_as("fraud@aegis.local")

    note_response = client.post(
        "/api/assist/operator-note",
        json={"case_id": case["id"]},
        headers=csrf_headers(),
    )
    assert note_response.status_code == 200
    assert note_response.json()["assist_type"] == "operator_note"

    explanation_response = client.post(
        "/api/assist/playbook-explanation",
        json={"case_id": case["id"], "recommended_step": "Verify member intent"},
        headers=csrf_headers(),
    )
    assert explanation_response.status_code == 200
    assert explanation_response.json()["assist_type"] == "playbook_explanation"
    assert "Verify member intent" in explanation_response.json()["draft"]


def test_assist_endpoint_requires_csrf_for_authenticated_unsafe_request():
    case = create_assist_case()
    login_as("manager@aegis.local")

    response = client.post("/api/assist/case-summary", json={"case_id": case["id"]})

    assert response.status_code == 403


def test_assist_generation_does_not_mutate_case_state():
    case = create_assist_case()
    before = {
        "status": case["status"],
        "assigned_owner": case["assigned_owner"],
        "assigned_team": case["assigned_team"],
        "outcome_type": case["outcome_type"],
        "closed_at": case["closed_at"],
    }
    login_as("fraud@aegis.local")

    response = client.post(
        "/api/assist/operator-note",
        json={"case_id": case["id"]},
        headers=csrf_headers(),
    )
    assert response.status_code == 200

    current = client.get(f"/api/scam-cases/{case['id']}").json()
    after = {
        "status": current["status"],
        "assigned_owner": current["assigned_owner"],
        "assigned_team": current["assigned_team"],
        "outcome_type": current["outcome_type"],
        "closed_at": current["closed_at"],
    }

    assert after == before
    assert current["action_logs"][0]["action_type"] == "assist_draft_generated"
    assert current["action_logs"][0]["actor_email"] == "fraud@aegis.local"
