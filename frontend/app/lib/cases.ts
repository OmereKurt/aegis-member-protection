export type BackendStatus = "New" | "In Review" | "Escalated" | "Closed";

export type OutcomeType =
  | "member_protected"
  | "funds_blocked_or_held"
  | "trusted_contact_engaged"
  | "fraud_ops_escalation_completed"
  | "monitoring_only"
  | "false_concern_no_exploitation_found"
  | "funds_sent_loss_occurred"
  | "customer_unreachable"
  | "other"
  | "customer_protected"
  | "funds_blocked"
  | "funds_lost"
  | "false_alarm"
  | "follow_up_required"
  | "unknown";

export const outcomeOptions: { value: OutcomeType; label: string }[] = [
  { value: "member_protected", label: "Member protected" },
  { value: "funds_blocked_or_held", label: "Funds blocked or held" },
  { value: "trusted_contact_engaged", label: "Trusted contact engaged" },
  { value: "fraud_ops_escalation_completed", label: "Fraud ops escalation completed" },
  { value: "monitoring_only", label: "Monitoring only" },
  { value: "false_concern_no_exploitation_found", label: "False concern / no exploitation found" },
  { value: "funds_sent_loss_occurred", label: "Funds sent / loss occurred" },
  { value: "customer_unreachable", label: "Customer unreachable" },
  { value: "other", label: "Other" },
];

export function outcomeLabel(value?: string | null) {
  if (!value) return "Not recorded";
  return (
    outcomeOptions.find((item) => item.value === value)?.label ||
    {
      customer_protected: "Member protected",
      funds_blocked: "Funds blocked or held",
      funds_lost: "Funds sent / loss occurred",
      false_alarm: "False concern / no exploitation found",
      follow_up_required: "Monitoring only",
      unknown: "Other",
    }[value] ||
    value.replace(/_/g, " ")
  );
}

export type ActionLog = {
  id: number;
  created_at?: string | null;
  action_type: string;
  details: string;
  actor_email?: string | null;
  actor_role?: string | null;
};

export type CaseSignal = {
  label: string;
  present: boolean;
  severity: "watch" | "low" | "medium" | "high" | string;
  evidence: string;
};

export type CaseIntelligence = {
  likely_pattern_code: string;
  likely_pattern: string;
  signal_strength: "Limited" | "Moderate" | "Strong" | "Critical" | string;
  risk_drivers: string[];
  missing_information: string[];
  recommended_next_steps: string[];
  suggested_escalation_path: string[];
  structured_signals: CaseSignal[];
  why_high_risk: string[];
  member_context?: {
    display_name?: string;
    source_unit?: string;
    transaction_type?: string;
    amount_at_risk?: number;
    trusted_contact_available?: boolean;
  };
};

export type BackendCase = {
  id: number;
  case_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  status: BackendStatus | string;
  urgency: "Low" | "Medium" | "High" | "Critical" | string;
  urgency_score: number;
  scam_type: string;
  title: string;
  summary: string;
  customer_identifier: string;
  full_name?: string | null;
  age_band: string;
  vulnerable_adult_flag: boolean;
  source_unit: string;
  assigned_owner?: string | null;
  assigned_team?: string | null;
  trusted_contact_exists: boolean;
  trusted_contact_name?: string | null;
  trusted_contact_phone?: string | null;
  intake_channel: string;
  transaction_type: string;
  amount_at_risk: number;
  money_already_left: boolean;
  customer_currently_on_call_with_scammer: boolean;
  new_payee_or_destination: boolean;
  customer_told_to_keep_secret: boolean;
  narrative: string;
  urgency_reasons: string[];
  risk_factors: Record<string, boolean>;
  playbook: {
    recommended_questions?: string[];
    recommended_actions?: string[];
    recommended_escalation_path?: string[];
    escalation_required?: boolean;
    hold_recommended?: boolean;
    trusted_contact_recommended?: boolean;
    law_enforcement_reporting_recommended?: boolean;
  };
  case_intelligence?: CaseIntelligence;
  notes: string;
  outcome_type?: string | null;
  closure_notes?: string | null;
  closure_summary?: string | null;
  estimated_amount_protected?: number | null;
  estimated_amount_lost?: number | null;
  trusted_contact_engaged?: boolean | null;
  fraud_ops_involved?: boolean | null;
  follow_up_required?: boolean | null;
  closed_at?: string | null;
  action_logs: ActionLog[];
};

export type TimelineItem = {
  title: string;
  time: string;
  body: string;
};

export type QueueCase = {
  id: string;
  backendId?: number;
  caseNumber?: string;
  title: string;
  source: string;
  sourceGroup: string;
  member: string;
  risk: "Low" | "Medium" | "High" | "Critical";
  status: "New" | "Review" | "Escalated" | "Closed";
  owner: string;
  age: string;
  nextStep: string;
  summary: string;
  note: string;
  recommendedActions: string[];
  intelligence?: CaseIntelligence;
  closure?: {
    outcomeType?: string | null;
    outcomeLabel: string;
    closureSummary?: string | null;
    estimatedAmountProtected?: number | null;
    estimatedAmountLost?: number | null;
    trustedContactEngaged?: boolean | null;
    fraudOpsInvolved?: boolean | null;
    followUpRequired?: boolean | null;
    closedAt?: string | null;
  };
  timeline: TimelineItem[];
};

export type CaseIntakePayload = {
  customer_identifier: string;
  full_name?: string | null;
  age_band: string;
  vulnerable_adult_flag: boolean;
  source_unit: string;
  trusted_contact_exists: boolean;
  trusted_contact_name?: string | null;
  trusted_contact_phone?: string | null;
  intake_channel: string;
  transaction_type: string;
  amount_at_risk: number;
  money_already_left: boolean;
  customer_currently_on_call_with_scammer: boolean;
  new_payee_or_destination: boolean;
  customer_told_to_keep_secret: boolean;
  narrative: string;
  phone_based_imposter_story?: boolean;
  government_or_bank_brand_impersonation?: boolean;
  fear_or_urgency_language?: boolean;
  secrecy_pressure?: boolean;
  high_dollar_amount?: boolean;
  older_or_vulnerable_customer?: boolean;
  repeat_attempt?: boolean;
  remote_access_or_tech_support_story?: boolean;
  crypto_or_gift_card_request?: boolean;
  romance_or_emotional_dependency_pattern?: boolean;
};

export type CaseActionPayload = {
  action_type?: string;
  label: string;
  details?: string;
  status?: BackendStatus;
  assigned_owner?: string | null;
  assigned_team?: string | null;
  notes?: string;
  money_already_left?: boolean;
  outcome_type?: OutcomeType;
  closure_notes?: string;
};

export type CaseClosurePayload = {
  outcome_type: OutcomeType;
  closure_summary: string;
  follow_up_required: boolean;
  estimated_amount_protected?: number | null;
  estimated_amount_lost?: number | null;
  trusted_contact_engaged: boolean;
  fraud_ops_involved: boolean;
  closure_notes?: string | null;
};

export function listCases() {
  return fetchJson<BackendCase[]>(apiUrl("/api/scam-cases/"));
}

export function getCase(id: number | string) {
  return fetchJson<BackendCase>(apiUrl(`/api/scam-cases/${id}`));
}

export function createCase(payload: CaseIntakePayload) {
  return fetchJson<BackendCase>(apiUrl("/api/scam-cases/"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCaseStatus(id: number, status: BackendStatus) {
  return fetchJson<BackendCase>(apiUrl(`/api/scam-cases/${id}/status`), {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function updateCaseAssignment(
  id: number,
  assigned_owner: string | null,
  assigned_team: string | null
) {
  return fetchJson<BackendCase>(apiUrl(`/api/scam-cases/${id}/assignment`), {
    method: "PUT",
    body: JSON.stringify({ assigned_owner, assigned_team }),
  });
}

export function updateCaseNotes(id: number, notes: string) {
  return fetchJson<BackendCase>(apiUrl(`/api/scam-cases/${id}/notes`), {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
}

export function closeCase(id: number, payload: CaseClosurePayload) {
  return fetchJson<BackendCase>(apiUrl(`/api/scam-cases/${id}/close`), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function recordCaseAction(id: number, payload: CaseActionPayload) {
  const actionType =
    payload.action_type || payload.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  return fetchJson<BackendCase>(apiUrl(`/api/scam-cases/${id}/actions`), {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      action_type: actionType || "structured_action",
    }),
  });
}

export function deleteCase(id: number) {
  return fetchJson<{ id: number; deleted: boolean }>(apiUrl(`/api/scam-cases/${id}`), {
    method: "DELETE",
  });
}

export function resetDemoData() {
  return fetchJson<{ deleted_cases: number; deleted_action_logs: number }>(
    apiUrl("/api/scam-cases/reset-demo-data"),
    { method: "POST" }
  );
}

export function seedDemoData() {
  return fetchJson<{
    seeded_cases: number;
    deleted_cases: number;
    deleted_action_logs: number;
  }>(apiUrl("/api/scam-cases/seed-demo-data"), { method: "POST" });
}

function displayStatus(status: string): QueueCase["status"] {
  if (status === "In Review") return "Review";
  if (status === "Escalated" || status === "Closed" || status === "New") return status;
  return "New";
}

function sourceGroup(sourceUnit: string, intakeChannel?: string) {
  const source = `${sourceUnit} ${intakeChannel || ""}`.toLowerCase();
  if (source.includes("branch")) return "Branch network";
  if (source.includes("contact") || source.includes("call") || source.includes("phone")) return "Contact center";
  if (source.includes("digital") || source.includes("online")) return "Digital banking";
  return "Fraud ops";
}

function displayOwner(record: BackendCase) {
  const team = record.assigned_team || "";
  if (/fraud/i.test(team)) return "Fraud Ops";
  if (/member protection/i.test(team)) return "Member Protection";
  if (/branch/i.test(team)) return "Branch Ops";
  return record.assigned_owner || team || "Queue";
}

function relativeAge(value?: string | null) {
  if (!value) return "Today";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Today";

  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr`;

  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function actionTitle(actionType: string) {
  const titles: Record<string, string> = {
    case_created: "Case created",
    status_changed: "Status changed",
    assignment_updated: "Assignment updated",
    notes_updated: "Operator note updated",
    case_closed: "Case closed",
  };
  return titles[actionType] || actionType.replace(/_/g, " ");
}

function timelineFromLogs(record: BackendCase): TimelineItem[] {
  if (!record.action_logs?.length) {
    return [
      {
        title: "Case available in operations",
        time: relativeAge(record.created_at),
        body: record.summary,
      },
    ];
  }

  return record.action_logs.slice(0, 6).map((log) => ({
    title: actionTitle(log.action_type),
    time: log.created_at
      ? new Date(log.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "Recent",
    body: log.details,
  }));
}

function nextStep(record: BackendCase) {
  if (record.status === "Closed") return "Closed with documentation";
  if (record.status === "Escalated") return "Supervisor and fraud review underway";
  if (record.status === "In Review") return "Awaiting documented follow-up and next action";

  const recommended = record.playbook?.recommended_escalation_path?.[0] || record.playbook?.recommended_actions?.[0];
  return recommended || "Document concern and move to first review.";
}

export function toQueueCase(record: BackendCase): QueueCase {
  const recommendedActions = record.playbook?.recommended_actions?.length
    ? record.playbook.recommended_actions
    : ["Review member intent and transaction urgency.", "Document observations and preserve timeline context."];

  return {
    id: String(record.id),
    backendId: record.id,
    caseNumber: record.case_id,
    title: record.title,
    source: record.source_unit,
    sourceGroup: sourceGroup(record.source_unit, record.intake_channel),
    member: record.full_name || record.customer_identifier,
    risk: ["Low", "Medium", "High", "Critical"].includes(record.urgency) ? (record.urgency as QueueCase["risk"]) : "Medium",
    status: displayStatus(record.status),
    owner: displayOwner(record),
    age: relativeAge(record.created_at),
    nextStep: nextStep(record),
    summary: record.summary || record.narrative,
    note: record.notes || "No operator note has been recorded yet.",
    recommendedActions,
    intelligence: record.case_intelligence,
    closure: {
      outcomeType: record.outcome_type,
      outcomeLabel: outcomeLabel(record.outcome_type),
      closureSummary: record.closure_summary || record.closure_notes,
      estimatedAmountProtected: record.estimated_amount_protected,
      estimatedAmountLost: record.estimated_amount_lost,
      trustedContactEngaged: record.trusted_contact_engaged,
      fraudOpsInvolved: record.fraud_ops_involved,
      followUpRequired: record.follow_up_required,
      closedAt: record.closed_at,
    },
    timeline: timelineFromLogs(record),
  };
}
import { apiUrl, fetchJson } from "./api";
