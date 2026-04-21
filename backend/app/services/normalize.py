from app.schemas.alert import PhishingEmailAlert, SuspiciousLoginAlert


def normalize_suspicious_login_alert(raw_alert: SuspiciousLoginAlert) -> dict:
    return {
        "alert_id": raw_alert.alert_id,
        "source": raw_alert.source,
        "alert_type": "suspicious_login",
        "timestamp": raw_alert.timestamp,
        "title": raw_alert.title,
        "user": {
            "email": raw_alert.user_email
        },
        "host": {
            "hostname": None,
            "ip": raw_alert.ip
        },
        "artifacts": {
            "ips": [raw_alert.ip],
            "domains": [],
            "hashes": [],
            "urls": []
        },
        "location": {
            "country": raw_alert.country,
            "city": raw_alert.city
        },
        "normalized_context": {
            "failed_logins_before_success": raw_alert.failed_logins_before_success,
            "impossible_travel": raw_alert.impossible_travel,
            "mfa_enabled": raw_alert.mfa_enabled,
            "new_geo": raw_alert.new_geo,
            "vpn_or_hosting_asn": raw_alert.vpn_or_hosting_asn,
            "privileged_user": raw_alert.privileged_user
        }
    }


def normalize_phishing_email_alert(raw_alert: PhishingEmailAlert) -> dict:
    return {
        "alert_id": raw_alert.alert_id,
        "source": raw_alert.source,
        "alert_type": "phishing_email",
        "timestamp": raw_alert.timestamp,
        "title": raw_alert.title,
        "user": {
            "email": raw_alert.recipient_email
        },
        "email": {
            "recipient": raw_alert.recipient_email,
            "sender": raw_alert.sender_email,
            "sender_domain": raw_alert.sender_domain,
            "subject": raw_alert.subject
        },
        "artifacts": {
            "ips": [],
            "domains": [raw_alert.sender_domain],
            "hashes": [],
            "urls": []
        },
        "normalized_context": {
            "display_name_mismatch": raw_alert.display_name_mismatch,
            "url_present": raw_alert.url_present,
            "attachment_present": raw_alert.attachment_present,
            "newly_registered_domain": raw_alert.newly_registered_domain,
            "multiple_recipients": raw_alert.multiple_recipients
        }
    }
