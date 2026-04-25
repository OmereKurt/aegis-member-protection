"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  closeCase,
  getCase,
  outcomeLabel,
  outcomeOptions,
  recordCaseAction,
  toQueueCase,
  updateCaseAssignment,
  updateCaseNotes,
  updateCaseStatus,
  type BackendCase,
  type BackendStatus,
  type CaseActionPayload,
  type CaseClosurePayload,
  type OutcomeType,
} from "../../lib/cases";

const structuredActions: {
  label: string;
  detail: string;
  payload: (record: BackendCase) => CaseActionPayload;
  priority: "primary" | "secondary";
}[] = [
  {
    label: "Verify member intent",
    detail: "Document independent confirmation before funds move.",
    priority: "primary",
    payload: () => ({
      label: "Verify member intent",
      details: "Operator initiated independent member-intent verification from the full case workspace.",
    }),
  },
  {
    label: "Escalate to supervisor",
    detail: "Move into escalation for supervisory review.",
    priority: "primary",
    payload: () => ({
      label: "Escalate to supervisor",
      status: "Escalated",
      details: "Supervisor escalation recorded from the full case workspace.",
    }),
  },
  {
    label: "Assign to fraud ops",
    detail: "Route ownership to Fraud Operations.",
    priority: "primary",
    payload: () => ({
      label: "Assign to fraud ops",
      assigned_owner: "Fraud Ops",
      assigned_team: "Fraud Operations",
      details: "Case assigned to Fraud Operations from the full case workspace.",
    }),
  },
  {
    label: "Attempt member callback",
    detail: "Log a callback attempt through trusted bank channels.",
    priority: "primary",
    payload: () => ({
      label: "Attempt member callback",
      details: "Operator attempted member callback through trusted bank channels.",
    }),
  },
  {
    label: "Contact trusted contact",
    detail: "Record trusted contact outreach when policy allows.",
    priority: "secondary",
    payload: () => ({
      label: "Contact trusted contact",
      details: "Trusted-contact outreach was initiated or reviewed for this case.",
    }),
  },
  {
    label: "Mark funds already left",
    detail: "Flag for loss-mitigation review.",
    priority: "secondary",
    payload: () => ({
      label: "Mark funds already left",
      money_already_left: true,
      details: "Operator marked that funds may already have left the account.",
    }),
  },
  {
    label: "Mark intervention complete",
    detail: "Move the case into review after the intervention is documented.",
    priority: "secondary",
    payload: (record) => ({
      label: "Mark intervention complete",
      status: record.status === "Closed" ? "Closed" : "In Review",
      details: "Immediate intervention marked complete from the full case workspace.",
    }),
  },
];

const emptyClosureForm = {
  outcome_type: "member_protected" as OutcomeType,
  closure_summary: "",
  follow_up_required: false,
  estimated_amount_protected: "",
  estimated_amount_lost: "",
  trusted_contact_engaged: false,
  fraud_ops_involved: false,
};

const MAX_TRACKED_AMOUNT = 1000000;

type PlaybookStatus = "Not started" | "In progress" | "Completed" | "Skipped";

type PlaybookStep = {
  id: string;
  label: string;
  detail: string;
  emphasis?: string;
};

function buildPlaybookSteps(record: BackendCase): PlaybookStep[] {
  const signals = record.case_intelligence?.structured_signals || [];
  const hasSignal = (label: string) => signals.some((signal) => signal.label === label && signal.present);

  return [
    {
      id: "verify_member_intent",
      label: "Verify member intent",
      detail: "Confirm the member's intent without third-party influence.",
      emphasis: hasSignal("Real-time coaching")
        ? "Real-time coaching is present, so verify away from the current call or companion."
        : undefined,
    },
    {
      id: "confirm_funds_status",
      label: "Confirm transaction / funds status",
      detail: "Determine whether funds are pending, held, or already gone.",
      emphasis: record.money_already_left
        ? "Funds may already have left. Prioritize loss-mitigation review."
        : undefined,
    },
    {
      id: "attempt_safe_callback",
      label: "Attempt safe member callback",
      detail: "Use known institution contact channels, not caller-provided instructions.",
      emphasis: hasSignal("Secrecy instruction")
        ? "Secrecy pressure makes a safe callback especially important."
        : undefined,
    },
    {
      id: "consider_trusted_contact",
      label: "Consider trusted contact",
      detail: record.trusted_contact_exists
        ? "Assess whether policy allows trusted contact outreach."
        : "No trusted contact is recorded; skip if outreach is not available.",
      emphasis: record.trusted_contact_exists ? "Trusted contact information is available." : undefined,
    },
    {
      id: "escalate_supervisor_fraud",
      label: "Escalate to supervisor or fraud ops",
      detail: "Route elevated cases to supervisor or Fraud Operations.",
      emphasis:
        record.urgency === "High" || record.urgency === "Critical"
          ? `${record.urgency} urgency supports escalation.`
          : undefined,
    },
    {
      id: "record_intervention_result",
      label: "Record intervention result",
      detail: "Document what happened, who was contacted, and what remains open.",
    },
    {
      id: "close_with_outcome",
      label: "Close case with outcome",
      detail: "Submit structured closure once the intervention outcome is known.",
    },
  ];
}

function logText(record: BackendCase) {
  return record.action_logs.map((log) => `${log.action_type} ${log.details}`.toLowerCase()).join("\n");
}

function storedPlaybookStatus(record: BackendCase, step: PlaybookStep): PlaybookStatus | null {
  const haystack = logText(record);
  const label = step.label.toLowerCase();

  if (
    haystack.includes(`playbook step skipped: ${label}`) ||
    haystack.includes(`playbook_step_skipped ${step.id}`)
  ) {
    return "Skipped";
  }

  if (
    haystack.includes(`playbook step completed: ${label}`) ||
    haystack.includes(`playbook_step_completed ${step.id}`)
  ) {
    return "Completed";
  }

  return null;
}

function inferredPlaybookStatus(record: BackendCase, step: PlaybookStep): PlaybookStatus | null {
  const haystack = logText(record);

  if (step.id === "verify_member_intent" && haystack.includes("verify_member_intent")) return "Completed";
  if (step.id === "confirm_funds_status" && (record.money_already_left || haystack.includes("mark_funds_already_left"))) {
    return "Completed";
  }
  if (step.id === "attempt_safe_callback" && haystack.includes("attempt_member_callback")) return "Completed";
  if (
    step.id === "consider_trusted_contact" &&
    (record.trusted_contact_engaged || haystack.includes("contact_trusted_contact"))
  ) {
    return "Completed";
  }
  if (
    step.id === "escalate_supervisor_fraud" &&
    (record.status === "Escalated" || /fraud/i.test(record.assigned_team || "") || haystack.includes("assign_to_fraud_ops"))
  ) {
    return "Completed";
  }
  if (step.id === "record_intervention_result" && haystack.includes("mark_intervention_complete")) return "Completed";
  if (step.id === "close_with_outcome" && record.status === "Closed") return "Completed";

  return null;
}

function playbookStatus(record: BackendCase, step: PlaybookStep, recommendedStepId?: string): PlaybookStatus {
  return (
    storedPlaybookStatus(record, step) ||
    inferredPlaybookStatus(record, step) ||
    (recommendedStepId === step.id ? "In progress" : "Not started")
  );
}

function recommendedPlaybookReason(record: BackendCase, step?: PlaybookStep) {
  if (record.status === "Closed") return "This case is closed, so the guided workflow is locked.";
  if (!step) return "All required intervention steps are complete. Use the closure workflow when ready.";

  if (step.id === "verify_member_intent") return "Start by confirming the member's intent without outside influence.";
  if (step.id === "confirm_funds_status") {
    return record.money_already_left
      ? "Funds may already have moved, so confirm loss status before next contact."
      : "Confirm whether the transaction is pending, held, or still preventable.";
  }
  if (step.id === "attempt_safe_callback") return "Use a known contact channel before relying on the current interaction.";
  if (step.id === "consider_trusted_contact") {
    return record.trusted_contact_exists
      ? "A trusted contact is available and may support safe intervention."
      : "No trusted contact is recorded; skip if outreach is not available.";
  }
  if (step.id === "escalate_supervisor_fraud") return "The current risk profile may need supervisor or fraud operations review.";
  if (step.id === "record_intervention_result") return "Document what happened before moving to closure.";
  return "Closure should be completed through the structured outcome form.";
}

function badgeClass(type: "risk" | "status", value: string) {
  const normalized = value.toLowerCase();
  if (type === "status") {
    if (normalized === "closed") return "badge badge-status-closed";
    if (normalized === "in review" || normalized === "review") return "badge badge-status-review";
    if (normalized === "escalated") return "badge badge-status-escalated";
    return "badge badge-status-new";
  }

  if (normalized === "low") return "badge badge-low";
  if (normalized === "medium") return "badge badge-medium";
  if (normalized === "high") return "badge badge-high";
  return "badge badge-critical";
}

function formatCurrency(value?: number | null) {
  return Number(value || 0).toLocaleString([], {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatTime(value?: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function trackedAmount(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;

  const bounded = Math.min(MAX_TRACKED_AMOUNT, Math.max(0, parsed));
  return Math.round(bounded * 100) / 100;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = String(params.id);

  const [caseData, setCaseData] = useState<BackendCase | null>(null);
  const [statusValue, setStatusValue] = useState<BackendStatus>("New");
  const [notesValue, setNotesValue] = useState("");
  const [assignedOwnerValue, setAssignedOwnerValue] = useState("");
  const [assignedTeamValue, setAssignedTeamValue] = useState("");
  const [closureForm, setClosureForm] = useState(emptyClosureForm);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function loadCase() {
    try {
      setIsLoading(true);
      const data = await getCase(caseId);
      setCaseData(data);
      setStatusValue(data.status as BackendStatus);
      setNotesValue(data.notes || "");
      setAssignedOwnerValue(data.assigned_owner || "");
      setAssignedTeamValue(data.assigned_team || "");
      setClosureForm({
        outcome_type: (data.outcome_type as OutcomeType) || "member_protected",
        closure_summary: data.closure_summary || data.closure_notes || "",
        follow_up_required: Boolean(data.follow_up_required),
        estimated_amount_protected: data.estimated_amount_protected?.toString() || "",
        estimated_amount_lost: data.estimated_amount_lost?.toString() || "",
        trusted_contact_engaged: Boolean(data.trusted_contact_engaged),
        fraud_ops_involved: Boolean(data.fraud_ops_involved),
      });
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!caseId) return;
    const timeout = window.setTimeout(() => {
      void loadCase();
    }, 0);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const queueCase = useMemo(() => (caseData ? toQueueCase(caseData) : null), [caseData]);
  const intelligence = caseData?.case_intelligence;
  const primaryActions = structuredActions.filter((action) => action.priority === "primary");
  const secondaryActions = structuredActions.filter((action) => action.priority === "secondary");
  const playbookSteps = useMemo(() => (caseData ? buildPlaybookSteps(caseData) : []), [caseData]);
  const recommendedPlaybookStep = useMemo(() => {
    if (!caseData || caseData.status === "Closed") return undefined;
    return playbookSteps.find((step) => {
      const status = storedPlaybookStatus(caseData, step) || inferredPlaybookStatus(caseData, step);
      return status !== "Completed" && status !== "Skipped";
    });
  }, [caseData, playbookSteps]);

  async function runAction(action: () => Promise<unknown>, message: string) {
    try {
      setActionInFlight(true);
      await action();
      await loadCase();
      setFeedback(message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionInFlight(false);
    }
  }

  function updateClosureForm<K extends keyof typeof closureForm>(key: K, value: (typeof closureForm)[K]) {
    setClosureForm((current) => ({ ...current, [key]: value }));
  }

  function handleStatusSave() {
    if (!caseData) return;
    void runAction(
      () => updateCaseStatus(caseData.id, statusValue),
      "Case status updated."
    );
  }

  function handleAssignmentSave() {
    if (!caseData) return;
    void runAction(
      () => updateCaseAssignment(caseData.id, assignedOwnerValue || null, assignedTeamValue || null),
      "Case assignment updated."
    );
  }

  function handleNotesSave() {
    if (!caseData) return;
    void runAction(
      () => updateCaseNotes(caseData.id, notesValue),
      "Operator notes saved."
    );
  }

  function handleStructuredAction(payloadFactory: (record: BackendCase) => CaseActionPayload) {
    if (!caseData) return;
    const payload = payloadFactory(caseData);
    void runAction(
      () => recordCaseAction(caseData.id, payload),
      `${payload.label} logged.`
    );
  }

  function handlePlaybookStep(step: PlaybookStep, status: "completed" | "skipped") {
    if (!caseData) return;
    const actionWord = status === "completed" ? "completed" : "skipped";
    void runAction(
      () =>
        recordCaseAction(caseData.id, {
          action_type: `playbook_step_${actionWord}`,
          label: `Playbook step ${actionWord}: ${step.label}`,
          details: `Playbook step ${actionWord}: ${step.label}.`,
        }),
      `Playbook step ${actionWord}: ${step.label}.`
    );
  }

  function handleSubmitClosure() {
    if (!caseData) return;
    if (!closureForm.closure_summary.trim()) {
      setError("Add a closure summary before closing the case.");
      return;
    }

    const payload: CaseClosurePayload = {
      outcome_type: closureForm.outcome_type,
      closure_summary: closureForm.closure_summary.trim(),
      follow_up_required: closureForm.follow_up_required,
      estimated_amount_protected: trackedAmount(closureForm.estimated_amount_protected),
      estimated_amount_lost: trackedAmount(closureForm.estimated_amount_lost),
      trusted_contact_engaged: closureForm.trusted_contact_engaged,
      fraud_ops_involved: closureForm.fraud_ops_involved,
    };

    void runAction(
      () => closeCase(caseData.id, payload),
      "Closure outcome recorded and case closed."
    );
  }

  return (
    <main className="page-wrap full-case-page-wrap">
      <section className="page-header full-case-page-header">
        <div>
          <div className="page-kicker">Full case workspace</div>
          <h1 className="page-title">{caseData?.title || "Member protection case"}</h1>
          <p className="page-subtitle">
            Work the case with the full record, intelligence, actions, history, and closure workflow.
          </p>
        </div>
        <div className="button-row full-case-header-actions">
          <Link href="/ops" className="button button-secondary">
            Back to Queue
          </Link>
        </div>
      </section>

      {isLoading ? <div className="ops-inline-banner">Loading case workspace...</div> : null}
      {error ? <div className="ops-inline-banner">{error}</div> : null}
      {feedback ? <div className="ops-inline-banner">{feedback}</div> : null}

      {caseData && queueCase ? (
        <>
          <section className="workspace-hero full-case-command-bar">
            <div className="workspace-title-row">
              <div className="workspace-title-block">
                <h2>{caseData.case_id}</h2>
              </div>
              <div className="inline-badge-row">
                <span className={badgeClass("risk", caseData.urgency)}>{caseData.urgency}</span>
                <span className={badgeClass("status", caseData.status)}>{caseData.status}</span>
              </div>
            </div>

            <div className="workspace-meta-grid full-case-meta-grid">
              <div className="workspace-meta-item">
                <div className="label">Likely pattern</div>
                <div className="value">{intelligence?.likely_pattern || caseData.scam_type}</div>
              </div>
              <div className="workspace-meta-item">
                <div className="label">Source unit</div>
                <div className="value">{caseData.source_unit}</div>
              </div>
              <div className="workspace-meta-item">
                <div className="label">Owner / team</div>
                <div className="value">
                  {caseData.assigned_owner || "Unassigned"} · {caseData.assigned_team || "Queue"}
                </div>
              </div>
              <div className="workspace-meta-item">
                <div className="label">Next step</div>
                <div className="value">{queueCase.nextStep}</div>
              </div>
            </div>
            <p className="workspace-subtle full-case-command-summary">{caseData.summary}</p>
          </section>

          <section className="full-case-workspace-grid">
            <div className="full-case-main-column evidence-column">
              <section className="workspace-panel evidence-panel">
                <h3 className="workspace-section-title">Overview</h3>
                <div className="workspace-meta-grid">
                  <div className="workspace-meta-item">
                    <div className="label">Member</div>
                    <div className="value">{caseData.full_name || caseData.customer_identifier}</div>
                  </div>
                  <div className="workspace-meta-item">
                    <div className="label">Age band</div>
                    <div className="value">{caseData.age_band}</div>
                  </div>
                  <div className="workspace-meta-item">
                    <div className="label">Amount at risk</div>
                    <div className="value">{formatCurrency(caseData.amount_at_risk)}</div>
                  </div>
                  <div className="workspace-meta-item">
                    <div className="label">Transaction type</div>
                    <div className="value">{caseData.transaction_type}</div>
                  </div>
                  <div className="workspace-meta-item">
                    <div className="label">Trusted contact</div>
                    <div className="value">
                      {caseData.trusted_contact_exists
                        ? caseData.trusted_contact_name || "Available"
                        : "Not available"}
                    </div>
                  </div>
                  <div className="workspace-meta-item">
                    <div className="label">Funds already left</div>
                    <div className="value">{caseData.money_already_left ? "Yes" : "No"}</div>
                  </div>
                </div>
                <div className="readonly-box" style={{ marginTop: 16 }}>
                  <strong>Staff narrative</strong>
                  <p style={{ margin: "8px 0 0" }}>{caseData.narrative}</p>
                </div>
              </section>

              <section className="workspace-panel evidence-panel">
                <h3 className="workspace-section-title">Signals</h3>
                <div className="signal-list full-case-signal-grid">
                  {intelligence?.structured_signals?.map((signal) => (
                    <div className={`signal-row${signal.present ? " is-present" : ""}`} key={signal.label}>
                      <div>
                        <div className="signal-title">{signal.label}</div>
                        <div className="muted">{signal.evidence}</div>
                      </div>
                      <span className="signal-status">{signal.present ? signal.severity : "Watch"}</span>
                    </div>
                  ))}
                </div>
                <div className="intelligence-grid" style={{ marginTop: 16 }}>
                  <div className="readonly-box">
                    <strong>Risk drivers</strong>
                    <ul className="workspace-list">
                      {(intelligence?.risk_drivers || caseData.urgency_reasons).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="readonly-box">
                    <strong>Missing information</strong>
                    <ul className="workspace-list">
                      {(intelligence?.missing_information || ["No missing information recorded."]).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="workspace-panel evidence-panel timeline-panel">
                <h3 className="workspace-section-title">History</h3>
                <div className="timeline-list">
                  {caseData.action_logs.length ? (
                    caseData.action_logs.map((log) => (
                      <div className="timeline-item" key={log.id}>
                        <div className="timeline-item-title">{log.action_type.replace(/_/g, " ")}</div>
                        <div className="timeline-item-time">{formatTime(log.created_at)}</div>
                        <div className="muted">{log.details}</div>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No case history has been logged yet.</div>
                  )}
                </div>
              </section>
            </div>

            <aside className="full-case-side-column operator-cockpit">
              <section className="workspace-panel cockpit-panel cockpit-intelligence">
                <h3 className="workspace-section-title">Case Intelligence</h3>
                <div className="reporting-list">
                  <div className="reporting-row">
                    <div className="reporting-row-label">Signal strength</div>
                    <div className="reporting-row-value">{intelligence?.signal_strength || caseData.urgency}</div>
                  </div>
                  <div className="reporting-row">
                    <div className="reporting-row-label">Pattern</div>
                    <div className="reporting-row-value">{intelligence?.likely_pattern || caseData.scam_type}</div>
                  </div>
                </div>
                <ul className="workspace-list">
                  {(intelligence?.why_high_risk || caseData.urgency_reasons).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="workspace-panel cockpit-panel cockpit-playbook">
                <div className="workspace-title-row">
                  <div className="workspace-title-block">
                    <h3 className="workspace-section-title">Guided Intervention Playbook</h3>
                    <p className="workspace-subtle">
                      {caseData.status === "Closed"
                        ? "Case closed. Playbook is read-only."
                        : `Recommended next step: ${recommendedPlaybookStep?.label || "Ready for closure"}`}
                    </p>
                  </div>
                </div>

                <div className="recommended-step-card">
                  <div className="label">Recommended next step</div>
                  <strong>
                    {caseData.status === "Closed"
                      ? "Workflow locked"
                      : recommendedPlaybookStep?.label || "Ready for closure"}
                  </strong>
                  <p>{recommendedPlaybookReason(caseData, recommendedPlaybookStep)}</p>
                </div>

                <div className="playbook-step-list">
                  {playbookSteps.map((step, index) => {
                    const status = playbookStatus(caseData, step, recommendedPlaybookStep?.id);
                    const isLocked = caseData.status === "Closed" || status === "Completed" || status === "Skipped";
                    const isClosureStep = step.id === "close_with_outcome";
                    return (
                      <div className={`playbook-step playbook-step-${status.toLowerCase().replace(/\s/g, "-")}`} key={step.id}>
                        <div className="playbook-step-index">{index + 1}</div>
                        <div className="playbook-step-body">
                          <div className="playbook-step-topline">
                            <strong>{step.label}</strong>
                            <span>{status}</span>
                          </div>
                          <p>{step.detail}</p>
                          {step.emphasis ? <div className="playbook-step-emphasis">{step.emphasis}</div> : null}
                          {status === "Completed" || status === "Skipped" ? (
                            <div className="playbook-step-state-note">
                              {status === "Completed" ? "Step recorded as complete." : "Step recorded as skipped."}
                            </div>
                          ) : isClosureStep ? (
                            <a className="playbook-step-link" href="#closure-outcome">
                              Use closure / outcome form
                            </a>
                          ) : (
                            <div className="playbook-step-actions">
                              <button
                                type="button"
                                className="button button-secondary button-compact"
                                onClick={() => handlePlaybookStep(step, "completed")}
                                disabled={actionInFlight || isLocked}
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                className="button button-secondary button-compact"
                                onClick={() => handlePlaybookStep(step, "skipped")}
                                disabled={actionInFlight || isLocked}
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="workspace-panel cockpit-panel cockpit-actions" id="closure-outcome">
                <h3 className="workspace-section-title">Primary Actions</h3>
                <div className="primary-action-grid">
                  {primaryActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      className="workstation-action-button"
                      onClick={() => handleStructuredAction(action.payload)}
                      disabled={actionInFlight}
                    >
                      <span>{action.label}</span>
                      <small>{action.detail}</small>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="button button-secondary more-actions-toggle"
                  onClick={() => setShowMoreActions((current) => !current)}
                >
                  {showMoreActions ? "Hide more actions" : "More actions"}
                </button>

                {showMoreActions ? (
                  <div className="secondary-action-grid">
                    {secondaryActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        className="workstation-action-button workstation-action-button-secondary"
                        onClick={() => handleStructuredAction(action.payload)}
                        disabled={actionInFlight}
                      >
                        <span>{action.label}</span>
                        <small>{action.detail}</small>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="closure-form-grid" style={{ marginTop: 16 }}>
                  <div className="field-group">
                    <label>Status</label>
                    <select value={statusValue} onChange={(event) => setStatusValue(event.target.value as BackendStatus)}>
                      <option value="New">New</option>
                      <option value="In Review">In Review</option>
                      <option value="Escalated">Escalated</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Owner</label>
                    <input value={assignedOwnerValue} onChange={(event) => setAssignedOwnerValue(event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label>Team</label>
                    <input value={assignedTeamValue} onChange={(event) => setAssignedTeamValue(event.target.value)} />
                  </div>
                </div>

                <div className="button-row" style={{ marginTop: 14 }}>
                  <button type="button" className="button" onClick={handleStatusSave} disabled={actionInFlight}>
                    Save Status
                  </button>
                  <button type="button" className="button button-secondary" onClick={handleAssignmentSave} disabled={actionInFlight}>
                    Save Assignment
                  </button>
                </div>
              </section>

              <section className="workspace-panel cockpit-panel cockpit-notes">
                <h3 className="workspace-section-title">Operator Notes</h3>
                <div className="field-group">
                  <label>Case notes</label>
                  <textarea rows={5} value={notesValue} onChange={(event) => setNotesValue(event.target.value)} />
                </div>
                <div className="button-row" style={{ marginTop: 14 }}>
                  <button type="button" className="button button-secondary" onClick={handleNotesSave} disabled={actionInFlight}>
                    Save Notes
                  </button>
                </div>
              </section>

              <section className="workspace-panel cockpit-panel cockpit-closure">
                <h3 className="workspace-section-title">Closure / Outcome</h3>
                {caseData.status === "Closed" ? (
                  <div className="closure-summary-box">
                    <div className="reporting-list">
                      <div className="reporting-row">
                        <div className="reporting-row-label">Outcome</div>
                        <div className="reporting-row-value">{outcomeLabel(caseData.outcome_type)}</div>
                      </div>
                      <div className="reporting-row">
                        <div className="reporting-row-label">Protected</div>
                        <div className="reporting-row-value">{formatCurrency(caseData.estimated_amount_protected)}</div>
                      </div>
                      <div className="reporting-row">
                        <div className="reporting-row-label">Lost</div>
                        <div className="reporting-row-value">{formatCurrency(caseData.estimated_amount_lost)}</div>
                      </div>
                    </div>
                    <p className="workspace-subtle">{caseData.closure_summary || caseData.closure_notes}</p>
                  </div>
                ) : null}

                <div className="closure-form-panel">
                  <div className="closure-form-grid">
                    <div className="field-group">
                      <label>Outcome type</label>
                      <select
                        value={closureForm.outcome_type}
                        onChange={(event) => updateClosureForm("outcome_type", event.target.value as OutcomeType)}
                      >
                        {outcomeOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Follow-up required</label>
                      <select
                        value={closureForm.follow_up_required ? "yes" : "no"}
                        onChange={(event) => updateClosureForm("follow_up_required", event.target.value === "yes")}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Estimated amount protected</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max={MAX_TRACKED_AMOUNT}
                        step="100"
                        placeholder="$0"
                        value={closureForm.estimated_amount_protected}
                        onChange={(event) => updateClosureForm("estimated_amount_protected", event.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label>Estimated amount lost</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max={MAX_TRACKED_AMOUNT}
                        step="100"
                        placeholder="$0"
                        value={closureForm.estimated_amount_lost}
                        onChange={(event) => updateClosureForm("estimated_amount_lost", event.target.value)}
                      />
                    </div>
                  </div>
                  <p className="field-help">
                    Currency amounts are stored as USD and capped at {formatCurrency(MAX_TRACKED_AMOUNT)} for clean demo reporting.
                  </p>

                  <div className="closure-toggle-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={closureForm.trusted_contact_engaged}
                        onChange={(event) => updateClosureForm("trusted_contact_engaged", event.target.checked)}
                      />
                      Trusted contact engaged
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={closureForm.fraud_ops_involved}
                        onChange={(event) => updateClosureForm("fraud_ops_involved", event.target.checked)}
                      />
                      Fraud ops involved
                    </label>
                  </div>

                  <div className="field-group">
                    <label>Closure summary</label>
                    <textarea
                      rows={5}
                      value={closureForm.closure_summary}
                      onChange={(event) => updateClosureForm("closure_summary", event.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="button"
                    onClick={handleSubmitClosure}
                    disabled={actionInFlight || !closureForm.closure_summary.trim()}
                  >
                    Submit Closure
                  </button>
                </div>
              </section>
            </aside>
          </section>
        </>
      ) : null}
    </main>
  );
}
