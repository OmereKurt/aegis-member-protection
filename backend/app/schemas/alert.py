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
