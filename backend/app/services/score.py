def score_suspicious_login(normalized_alert: dict) -> dict:
    context = normalized_alert["normalized_context"]

    score = 0
    reasons = []

    if context["impossible_travel"]:
        score += 30
        reasons.append("Impossible travel detected")

    if context["new_geo"]:
        score += 20
        reasons.append("Login from a new geography")

    if context["failed_logins_before_success"] > 5:
        score += 15
        reasons.append("Multiple failed logins before success")

    if context["vpn_or_hosting_asn"]:
        score += 20
        reasons.append("Source IP appears associated with a VPN or hosting provider")

    if not context["mfa_enabled"]:
        score += 15
        reasons.append("MFA is not enabled for the user")

    if context["privileged_user"]:
        score += 20
        reasons.append("Login involves a privileged or high-value user")

    if score >= 70:
        severity = "Critical"
    elif score >= 40:
        severity = "High"
    elif score >= 20:
        severity = "Medium"
    else:
        severity = "Low"

    return {
        "score": score,
        "severity": severity,
        "reasons": reasons
    }
