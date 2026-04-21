def generate_summary(normalized_alert: dict, score_result: dict) -> dict:
    user_email = normalized_alert["user"]["email"]
    location = normalized_alert["location"]
    ip_address = normalized_alert["host"]["ip"]
    severity = score_result["severity"]
    reasons = score_result["reasons"]

    reason_text = "; ".join(reasons) if reasons else "No strong indicators were identified"

    summary = (
        f"A suspicious login alert was generated for {user_email}. "
        f"The login originated from {location['city']}, {location['country']} "
        f"using source IP {ip_address}. "
        f"The event was classified as {severity} severity based on the following indicators: 
{reason_text}."
    )

    recommended_actions = [
        "Validate the login activity with the user",
        "Review recent sign-in activity for the account",
        "Review MFA status and recent MFA events",
        "Inspect additional activity from the same source IP",
        "Reset credentials and revoke active sessions if the activity cannot be confirmed"
    ]

    return {
        "summary": summary,
        "recommended_actions": recommended_actions
    }
