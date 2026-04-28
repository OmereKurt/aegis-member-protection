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

    def management_brief(self, context: dict) -> str:
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


def _percent(count: int, total: int) -> int:
    if not total:
        return 0
    return round((count / total) * 100)


def _currency(value: float) -> str:
    return f"${value:,.0f}"


def _count_by(cases: list[dict], key_fn) -> list[dict]:
    counts: dict[str, int] = {}
    for case in cases:
        key = key_fn(case) or "Unknown"
        counts[key] = counts.get(key, 0) + 1
    return [
        {"label": label, "value": value}
        for label, value in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]


def _pattern(case: dict) -> str:
    intelligence = case.get("case_intelligence") or {}
    return intelligence.get("likely_pattern") or str(case.get("scam_type") or "Unknown / other").replace("_", " ").title()


def _completed_playbook_count(case: dict) -> int:
    logs = case.get("action_logs") or []
    return sum(1 for log in logs if log.get("action_type") == "playbook_step_completed")


def build_management_brief_context(cases: list[dict]) -> dict:
    total_cases = len(cases)
    open_cases = sum(1 for case in cases if case.get("status") != "Closed")
    closed_cases = sum(1 for case in cases if case.get("status") == "Closed")
    escalated_cases = sum(1 for case in cases if case.get("status") == "Escalated")
    high_critical_cases = sum(1 for case in cases if case.get("urgency") in {"High", "Critical"})
    follow_up_required = sum(1 for case in cases if case.get("follow_up_required"))
    protected_amount = sum(float(case.get("estimated_amount_protected") or 0) for case in cases)
    lost_amount = sum(float(case.get("estimated_amount_lost") or 0) for case in cases)
    trusted_contact_engaged = sum(1 for case in cases if case.get("trusted_contact_engaged"))
    fraud_ops_involved = sum(1 for case in cases if case.get("fraud_ops_involved"))
    cases_with_playbook = sum(1 for case in cases if _completed_playbook_count(case) > 0)

    source_rows = _count_by(cases, lambda case: case.get("source_unit") or "Unknown")
    pattern_rows = _count_by(cases, _pattern)
    outcome_rows = _count_by(
        [case for case in cases if case.get("outcome_type")],
        lambda case: str(case.get("outcome_type")).replace("_", " "),
    )

    focus_points = []
    if high_critical_cases:
        focus_points.append(f"Review {high_critical_cases} high/critical cases for timely intervention coverage.")
    if follow_up_required:
        focus_points.append(f"Track {follow_up_required} cases with follow-up required after intervention or closure.")
    if open_cases and cases_with_playbook < open_cases:
        focus_points.append("Increase documented playbook activity on open cases before closure review.")
    if lost_amount > protected_amount:
        focus_points.append("Review loss cases and source patterns because recorded losses exceed protected estimates.")
    elif protected_amount > 0:
        focus_points.append("Maintain closure discipline where protected estimates are being captured.")
    if not focus_points:
        focus_points.append("Continue recording intake, playbook actions, and structured closure outcomes.")

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "closed_cases": closed_cases,
        "escalated_cases": escalated_cases,
        "high_critical_cases": high_critical_cases,
        "high_critical_share": _percent(high_critical_cases, total_cases),
        "follow_up_required": follow_up_required,
        "protected_amount": protected_amount,
        "lost_amount": lost_amount,
        "trusted_contact_engaged": trusted_contact_engaged,
        "trusted_contact_rate": _percent(trusted_contact_engaged, closed_cases or total_cases),
        "fraud_ops_involved": fraud_ops_involved,
        "fraud_ops_rate": _percent(fraud_ops_involved, closed_cases or total_cases),
        "playbook_progress": _percent(cases_with_playbook, total_cases),
        "top_source": source_rows[0] if source_rows else None,
        "top_pattern": pattern_rows[0] if pattern_rows else None,
        "outcome_rows": outcome_rows[:5],
        "focus_points": focus_points[:4],
    }


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

    def management_brief(self, context: dict) -> str:
        total = context["total_cases"]
        if total == 0:
            return (
                "Management Brief\n"
                "1. Current posture: No live member protection cases are recorded yet.\n"
                "2. Key operational concerns: Reporting will populate once intakes, playbook actions, and outcomes are recorded.\n"
                "3. Outcome performance: No protected/lost amount or closure outcome data is available yet.\n"
                "4. Recommended management focus: Seed demo data for walkthroughs or submit live intakes to begin validating source, pattern, intervention, and outcome reporting."
            )

        top_source = context.get("top_source") or {"label": "Unknown", "value": 0}
        top_pattern = context.get("top_pattern") or {"label": "Unknown / other", "value": 0}
        outcome_rows = context.get("outcome_rows") or []
        outcome_text = (
            "; ".join(f"{row['label']}: {row['value']}" for row in outcome_rows)
            if outcome_rows
            else "No closure outcomes have been recorded yet"
        )
        focus_text = "\n".join(f"- {item}" for item in context.get("focus_points", []))

        return (
            "Management Brief\n"
            f"1. Current posture: {total} total cases are recorded, with {context['open_cases']} open, "
            f"{context['closed_cases']} closed, and {context['escalated_cases']} escalated. "
            f"High/critical cases represent {context['high_critical_share']}% of current volume.\n"
            f"2. Key operational concerns: {top_source['label']} is the top source unit by volume "
            f"({top_source['value']} cases), and {top_pattern['label']} is the most common likely pattern "
            f"({top_pattern['value']} cases). {context['follow_up_required']} cases require follow-up.\n"
            f"3. Outcome performance: Estimated protected amount is {_currency(context['protected_amount'])} "
            f"versus {_currency(context['lost_amount'])} recorded lost. Outcome mix: {outcome_text}. "
            f"Trusted contact engagement is {context['trusted_contact_rate']}%; Fraud Ops involvement is {context['fraud_ops_rate']}%.\n"
            f"4. Recommended management focus:\n{focus_text}\n"
            f"Playbook documentation is present on {context['playbook_progress']}% of cases. This draft is for management review only and does not change reporting or case state."
        )


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
    if assist_type == "management_brief":
        return [
            "case_volume",
            "status_counts",
            "risk_distribution",
            "source_units",
            "likely_patterns",
            "closure_outcomes",
            "protected_lost_amounts",
            "follow_up_flags",
            "trusted_contact_engagement",
            "fraud_ops_involvement",
            "playbook_action_history",
        ]
    return [*base_fields, "summary", "narrative"]
