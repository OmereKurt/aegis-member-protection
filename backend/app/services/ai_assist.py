import os
from dataclasses import dataclass
from typing import Optional, Protocol


ASSIST_DISCLAIMER = (
    "AI-generated draft. Review before use. Aegis Assist does not change case status, "
    "risk, owner, closure, or outcomes."
)


@dataclass(frozen=True)
class AssistSettings:
    enabled: bool
    provider: str
    api_key: Optional[str]
    model: str
    request_timeout_seconds: int


def get_assist_settings() -> AssistSettings:
    return AssistSettings(
        enabled=os.getenv("AI_ASSIST_ENABLED", "true").lower() == "true",
        provider=os.getenv("AI_PROVIDER", "mock").strip().lower() or "mock",
        api_key=os.getenv("AI_API_KEY") or None,
        model=os.getenv("AI_MODEL", "aegis-mock-assist"),
        request_timeout_seconds=int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "15")),
    )


class AssistProvider(Protocol):
    name: str

    def case_summary(self, context: dict) -> str:
        ...

    def operator_note(self, context: dict) -> str:
        ...

    def playbook_explanation(self, context: dict, recommended_step: Optional[str]) -> str:
        ...


def _display(value, fallback: str = "Not recorded") -> str:
    if value is None:
        return fallback
    if isinstance(value, str) and not value.strip():
        return fallback
    return str(value)


def _first_present_signals(context: dict, limit: int = 3) -> list[dict]:
    signals = context.get("case_intelligence", {}).get("structured_signals", [])
    return [signal for signal in signals if signal.get("present")][:limit]


def _signal_labels(context: dict, limit: int = 3) -> str:
    labels = [signal.get("label") for signal in _first_present_signals(context, limit) if signal.get("label")]
    return ", ".join(labels) if labels else "limited structured signals"


def _recent_history(context: dict, limit: int = 3) -> str:
    logs = context.get("action_logs") or []
    if not logs:
        return "No prior action history is recorded."
    return " ".join(f"{log.get('action_type', 'action')}: {log.get('details', '')}" for log in logs[:limit])


def _recommended_steps(context: dict) -> str:
    steps = context.get("case_intelligence", {}).get("recommended_next_steps") or []
    if steps:
        return "; ".join(steps[:3])
    playbook = context.get("playbook") or {}
    return "; ".join((playbook.get("recommended_actions") or [])[:3]) or "Continue guided intervention workflow."


class MockAssistProvider:
    name = "mock"

    def case_summary(self, context: dict) -> str:
        intelligence = context.get("case_intelligence") or {}
        pattern = intelligence.get("likely_pattern") or context.get("scam_type") or "Unknown / other"
        drivers = intelligence.get("risk_drivers") or context.get("urgency_reasons") or []
        driver_text = "; ".join(drivers[:3]) if drivers else _signal_labels(context)
        return " ".join(
            [
                f"{_display(context.get('full_name'), context.get('customer_identifier', 'The member'))} has an open member protection case involving {pattern}.",
                f"The case is currently {_display(context.get('status'))} with {_display(context.get('urgency'))} urgency and is owned by {_display(context.get('assigned_owner') or context.get('assigned_team'), 'the queue')}.",
                f"Key risk drivers include {driver_text}.",
                f"The current next-step guidance is: {_recommended_steps(context)}",
                "This draft is for operator review and should not be treated as a final decision.",
            ]
        )

    def operator_note(self, context: dict) -> str:
        intelligence = context.get("case_intelligence") or {}
        pattern = intelligence.get("likely_pattern") or context.get("scam_type") or "Unknown / other"
        return " ".join(
            [
                f"Reviewed case {_display(context.get('case_id'))} for suspected exploitation indicators tied to {pattern}.",
                f"Structured signals reviewed: {_signal_labels(context, 4)}.",
                f"Current status is {_display(context.get('status'))}; owner/team is {_display(context.get('assigned_owner') or context.get('assigned_team'), 'unassigned')}.",
                f"Recent documented activity: {_recent_history(context)}",
                "Pending work: verify remaining intervention steps, document member contact, and record closure outcome when appropriate.",
            ]
        )

    def playbook_explanation(self, context: dict, recommended_step: Optional[str]) -> str:
        step = recommended_step or "the next incomplete intervention step"
        signals = _first_present_signals(context, 4)
        signal_text = ", ".join(signal.get("label", "signal") for signal in signals) or "the current risk profile"
        reason_parts = [f"{step} is recommended because the case includes {signal_text}."]
        if context.get("money_already_left"):
            reason_parts.append("Funds may already have left, so loss-mitigation and transaction-status confirmation should stay visible.")
        if context.get("trusted_contact_exists"):
            reason_parts.append("A trusted contact is recorded, which may support safe outreach if policy allows.")
        if context.get("customer_currently_on_call_with_scammer") or context.get("customer_told_to_keep_secret"):
            reason_parts.append("Real-time influence or secrecy pressure makes independent verification especially important.")
        reason_parts.append("This explanation supports operator judgment and does not update the case automatically.")
        return " ".join(reason_parts)


def get_assist_provider(settings: Optional[AssistSettings] = None) -> AssistProvider:
    settings = settings or get_assist_settings()
    # Mock is the safe default for local/dev/demo. Unsupported real providers intentionally fall back
    # to deterministic output until a reviewed provider implementation is added.
    if settings.provider == "mock" or not settings.api_key:
        return MockAssistProvider()
    return MockAssistProvider()


def assist_source_fields(assist_type: str) -> list[str]:
    base_fields = [
        "case_id",
        "status",
        "urgency",
        "assigned_owner",
        "assigned_team",
        "case_intelligence",
        "structured_signals",
        "playbook",
        "action_history",
    ]
    if assist_type == "operator_note":
        return [*base_fields, "operator_notes", "closure_fields"]
    if assist_type == "playbook_explanation":
        return [*base_fields, "recommended_playbook_step"]
    return [*base_fields, "summary", "narrative"]
