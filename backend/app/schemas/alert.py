from typing import Literal, Optional
from pydantic import BaseModel


class SuspiciousLoginAlert(BaseModel):
    alert_id: str
    source: str
    timestamp: str
    title: str
    user_email: str
    ip: str
    country: str
    city: str
    failed_logins_before_success: int
    impossible_travel: bool
    new_geo: bool
    mfa_enabled: bool
    vpn_or_hosting_asn: bool
    privileged_user: bool


class PhishingEmailAlert(BaseModel):
    alert_id: str
    source: str
    timestamp: str
    title: str
    recipient_email: str
    sender_email: str
    sender_domain: str
    subject: str
    display_name_mismatch: bool
    url_present: bool
    attachment_present: bool
    newly_registered_domain: bool
    multiple_recipients: bool


class AlertWrapper(BaseModel):
    alert_type: Literal["suspicious_login", "phishing_email"]

    suspicious_login: Optional[SuspiciousLoginAlert] = None
    phishing_email: Optional[PhishingEmailAlert] = None
