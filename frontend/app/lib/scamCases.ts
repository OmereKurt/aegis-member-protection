export type BackendStatus = "New" | "In Review" | "Escalated" | "Closed";

export type ActionLog = {
  id: number;
  created_at?: string | null;
  action_type: string;
  details: string;
};

export type BackendScamCase = {
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
  notes: string;
  outcome_type?: string | null;
  closure_notes?: string | null;
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
  timeline: TimelineItem[];
};

export type ScamCaseIntakePayload = {
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

const API_BASE = "/backend/api/scam-cases";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      // Keep the generic message when the backend does not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function listScamCases() {
  return fetchJson<BackendScamCase[]>(`${API_BASE}/`);
}

export function createScamCase(payload: ScamCaseIntakePayload) {
  return fetchJson<BackendScamCase>(`${API_BASE}/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateScamCaseStatus(id: number, status: BackendStatus) {
  return fetchJson<BackendScamCase>(`${API_BASE}/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function updateScamCaseAssignment(
  id: number,
  assigned_owner: string | null,
  assigned_team: string | null
) {
  return fetchJson<BackendScamCase>(`${API_BASE}/${id}/assignment`, {
    method: "PUT",
    body: JSON.stringify({ assigned_owner, assigned_team }),
  });
}

export function updateScamCaseNotes(id: number, notes: string) {
  return fetchJson<BackendScamCase>(`${API_BASE}/${id}/notes`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
}

export function deleteScamCase(id: number) {
  return fetchJson<{ id: number; deleted: boolean }>(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
}

export function resetDemoData() {
  return fetchJson<{ deleted_cases: number; deleted_action_logs: number }>(
    `${API_BASE}/reset-demo-data`,
    { method: "POST" }
  );
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

function displayOwner(record: BackendScamCase) {
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

function timelineFromLogs(record: BackendScamCase): TimelineItem[] {
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

function nextStep(record: BackendScamCase) {
  if (record.status === "Closed") return "Closed with documentation";
  if (record.status === "Escalated") return "Supervisor and fraud review underway";
  if (record.status === "In Review") return "Awaiting documented follow-up and next action";

  const recommended = record.playbook?.recommended_escalation_path?.[0] || record.playbook?.recommended_actions?.[0];
  return recommended || "Document concern and move to first review.";
}

export function toQueueCase(record: BackendScamCase): QueueCase {
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
    timeline: timelineFromLogs(record),
  };
}
