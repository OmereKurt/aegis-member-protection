def generate_summary(normalized_alert: dict, score_result: dict, enrichment: dict) -> dict:
    alert_type = normalized_alert["alert_type"]

    if alert_type == "suspicious_login":
        user_email = normalized_alert["user"]["email"]
        location = normalized_alert["location"]
        ip_address = normalized_alert["host"]["ip"]
        severity = score_result["severity"]
        reasons = score_result["reasons"]

        reason_text = "; ".join(reasons) if reasons else "No strong indicators were identified"
        enrichment_note = enrichment.get("note", "No enrichment note available.")

        summary = (
            f"A suspicious login alert was generated for {user_email}. "
            f"The login originated from {location['city']}, {location['country']} "
            f"using source IP {ip_address}. "
            f"The event was classified as {severity} severity based on the following indicators: {reason_text}. "
            f"Enrichment context: {enrichment_note}"
        )

        recommended_actions = [
            "Validate the login activity with the user",
            "Review recent sign-in activity for the account",
            "Review MFA status and recent MFA events",
            "Inspect additional activity from the same source IP",
            "Reset credentials and revoke active sessions if the activity cannot be confirmed"
        ]

        if enrichment.get("network_type") == "hosting":
            recommended_actions.insert(
                3,
                "Treat the source as higher risk because it appears associated with hosting or VPN infrastructure"
            )

        if enrichment.get("network_type") == "private":
            recommended_actions.insert(
                1,
                "Confirm whether the event originated from expected internal network space"
            )

        return {
            "summary": summary,
            "recommended_actions": recommended_actions
        }

    if alert_type == "phishing_email":
        email_info = normalized_alert["email"]
        severity = score_result["severity"]
        reasons = score_result["reasons"]

        reason_text = "; ".join(reasons) if reasons else "No strong indicators were identified"
        enrichment_note = enrichment.get("note", "No enrichment note available.")

        summary = (
            f"A phishing email alert was generated for recipient {email_info['recipient']}. "
            f"The message was sent from {email_info['sender']} with subject '{email_info['subject']}'. "
            f"The event was classified as {severity} severity based on the following indicators: {reason_text}. "
            f"Enrichment context: {enrichment_note}"
        )

        recommended_actions = [
            "Validate whether the email was reported or interacted with",
            "Search for matching emails sent to other recipients",
            "Block or quarantine the sender if confirmed malicious",
            "Review URLs and attachments associated with the email",
            "Reset user credentials if there are signs of credential submission"
        ]

        return {
            "summary": summary,
            "recommended_actions": recommended_actions
        }

    return {
        "summary": "Unsupported alert type.",
        "recommended_actions": []
    }
