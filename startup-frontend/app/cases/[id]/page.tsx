"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function urgencyClass(urgency: string) {
  const value = urgency.toLowerCase();
  if (value === "low") return "badge badge-low";
  if (value === "medium") return "badge badge-medium";
  if (value === "high") return "badge badge-high";
  return "badge badge-critical";
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value === "closed") return "badge badge-status-closed";
  if (value === "in review") return "badge badge-status-review";
  if (value === "escalated") return "badge badge-status-escalated";
  return "badge badge-status-new";
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

function humanizeScamType(value: string) {
  const map: Record<string, string> = {
    bank_imposter: "Bank Imposter",
    government_imposter: "Government Imposter",
    tech_support: "Tech Support",
    family_emergency: "Family Emergency",
    investment_crypto: "Investment / Crypto",
    romance: "Romance",
    unknown: "Unknown",
  };
  return map[value] || value;
}

function humanizeOutcome(value: string | null | undefined) {
  if (!value) return "Not set";
  const map: Record<string, string> = {
    customer_protected: "Customer Protected",
    funds_blocked: "Funds Blocked",
    funds_lost: "Funds Lost",
    false_alarm: "False Alarm",
    follow_up_required: "Follow Up Required",
    unknown: "Unknown",
  };
  return map[value] || value;
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = String(params.id);

  const [caseData, setCaseData] = useState<any>(null);
  const [error, setError] = useState("");
  const [statusValue, setStatusValue] = useState("New");
  const [notesValue, setNotesValue] = useState("");
  const [assignedOwnerValue, setAssignedOwnerValue] = useState("");
  const [assignedTeamValue, setAssignedTeamValue] = useState("");
  const [outcomeValue, setOutcomeValue] = useState("unknown");
  const [closureNotesValue, setClosureNotesValue] = useState("");

  async function loadCase() {
    try {
      const response = await fetch(`/backend/api/scam-cases/${caseId}`);
      if (!response.ok) throw new Error("Failed to load case");

      const data = await response.json();
      setCaseData(data);
      setStatusValue(data.status);
      setNotesValue(data.notes || "");
      setAssignedOwnerValue(data.assigned_owner || "");
      setAssignedTeamValue(data.assigned_team || "");
      setOutcomeValue(data.outcome_type || "unknown");
      setClosureNotesValue(data.closure_notes || "");
      setError("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  useEffect(() => {
    if (!caseId) return;
    loadCase();
  }, [caseId]);

  async function saveStatus() {
    try {
      const response = await fetch(`/backend/api/scam-cases/${caseId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      await loadCase();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  async function saveNotes() {
    try {
      const response = await fetch(`/backend/api/scam-cases/${caseId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      if (!response.ok) throw new Error("Failed to update notes");
      await loadCase();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  async function saveAssignment() {
    try {
      const response = await fetch(`/backend/api/scam-cases/${caseId}/assignment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_owner: assignedOwnerValue || null,
          assigned_team: assignedTeamValue || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to update assignment");
      await loadCase();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  async function closeCase() {
    if (!closureNotesValue.trim()) {
      setError("Closure notes are required before closing a case.");
      return;
    }

    try {
      const response = await fetch(`/backend/api/scam-cases/${caseId}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome_type: outcomeValue,
          closure_notes: closureNotesValue,
        }),
      });
      if (!response.ok) throw new Error("Failed to close case");
      await loadCase();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  async function quickStatus(status: string) {
    setStatusValue(status);
    try {
      const response = await fetch(`/backend/api/scam-cases/${caseId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      await loadCase();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <main className="page-wrap">
      <div className="page-header">
        <div className="page-kicker">Case Workspace</div>
        <h1 className="page-title">Member Protection Case</h1>
        <p className="page-subtitle">
          Review the case, coordinate the team response, document staff actions, and record the final outcome.
        </p>

        <div className="nav-row" style={{ marginTop: "16px" }}>
          <a href="/ops">Back to Operations</a>
          <a href="/cases/new">Start New Intake</a>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {!caseData && !error && <p className="muted">Loading case...</p>}

      {caseData && (
        <div className="workspace-grid">
          <div className="workspace-column">
            <section className="workspace-hero">
              <div className="workspace-title-row">
                <div className="workspace-title-block">
                  <h2>{caseData.title}</h2>
                  <div className="muted">{caseData.case_id}</div>
                </div>

                <div className="inline-badge-row">
                  <span className={urgencyClass(caseData.urgency)}>{caseData.urgency}</span>
                  <span className={statusClass(caseData.status)}>{caseData.status}</span>
                </div>
              </div>

              <div className="workspace-meta-grid">
                <div className="workspace-meta-item">
                  <div className="label">Member ID</div>
                  <div className="value">{caseData.customer_identifier}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Case Type</div>
                  <div className="value">{humanizeScamType(caseData.scam_type)}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Potential Loss</div>
                  <div className="value">${Number(caseData.amount_at_risk || 0).toLocaleString()}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Source Unit</div>
                  <div className="value">{caseData.source_unit}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Assigned Owner</div>
                  <div className="value">{caseData.assigned_owner || "Unassigned"}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Assigned Team</div>
                  <div className="value">{caseData.assigned_team || "Unassigned"}</div>
                </div>
              </div>

              <div className="button-row" style={{ marginTop: "18px" }}>
                {caseData.status !== "In Review" && caseData.status !== "Closed" && (
                  <button className="button" type="button" onClick={() => quickStatus("In Review")}>
                    Take Into Review
                  </button>
                )}
                {caseData.status !== "Escalated" && caseData.status !== "Closed" && (
                  <button className="button button-secondary" type="button" onClick={() => quickStatus("Escalated")}>
                    Escalate Now
                  </button>
                )}
              </div>

              <div className="workspace-callout" style={{ marginTop: "18px" }}>
                <strong>Case Summary</strong>
                <p style={{ margin: "8px 0 0" }}>{caseData.summary}</p>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Immediate Staff Guidance</h3>
              <p className="workspace-subtle">
                Use the recommended actions and escalation path below to standardize the next steps.
              </p>

              <div className="workspace-stack">
                <div className="readonly-box">
                  <strong>Priority actions</strong>
                  <ul className="workspace-list">
                    {caseData.playbook.recommended_actions.slice(0, 3).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="workspace-meta-grid">
                  <div className="workspace-meta-item">
                    <div className="label">Escalation Required</div>
                    <div className="value">{caseData.playbook.escalation_required ? "Yes" : "No"}</div>
                  </div>
                  <div className="workspace-meta-item">
                    <div className="label">Hold Likely Needed</div>
                    <div className="value">{caseData.playbook.hold_recommended ? "Yes" : "No"}</div>
                  </div>
                  <div className="workspace-meta-item">
                    <div className="label">Trusted Contact Outreach</div>
                    <div className="value">{caseData.playbook.trusted_contact_recommended ? "Yes" : "No"}</div>
                  </div>
                  <div className="workspace-meta-item">
                    <div className="label">External Reporting</div>
                    <div className="value">{caseData.playbook.law_enforcement_reporting_recommended ? "Yes" : "No"}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Intervention Questions and Actions</h3>

              <div className="workspace-stack">
                <div className="readonly-box">
                  <strong>Questions for the member</strong>
                  <ul className="workspace-list">
                    {caseData.playbook.recommended_questions.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="readonly-box">
                  <strong>Recommended escalation path</strong>
                  <ul className="workspace-list">
                    {(caseData.playbook.recommended_escalation_path || []).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Reported Event Details</h3>

              <div className="workspace-meta-grid">
                <div className="workspace-meta-item">
                  <div className="label">Intake Channel</div>
                  <div className="value">{caseData.intake_channel}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Transaction Type</div>
                  <div className="value">{caseData.transaction_type}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Funds Already Left</div>
                  <div className="value">{caseData.money_already_left ? "Yes" : "No"}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Live Contact with Scammer</div>
                  <div className="value">{caseData.customer_currently_on_call_with_scammer ? "Yes" : "No"}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">New Payee / Destination</div>
                  <div className="value">{caseData.new_payee_or_destination ? "Yes" : "No"}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Secrecy Pressure</div>
                  <div className="value">{caseData.customer_told_to_keep_secret ? "Yes" : "No"}</div>
                </div>
              </div>

              <div className="readonly-box" style={{ marginTop: "16px" }}>
                <strong>Staff narrative</strong>
                <p style={{ margin: "8px 0 0" }}>{caseData.narrative}</p>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Case Activity Timeline</h3>

              {caseData.action_logs.length === 0 ? (
                <p className="muted">No activity logged yet.</p>
              ) : (
                <div className="timeline-list">
                  {caseData.action_logs.map((log: any) => (
                    <div key={log.id} className="timeline-item">
                      <div className="timeline-item-title">{log.action_type}</div>
                      <div className="timeline-item-time">{formatTimestamp(log.created_at)}</div>
                      <div>{log.details}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="workspace-column">
            <section className="workspace-panel">
              <h3 className="workspace-section-title">Assignment</h3>
              <p className="workspace-subtle">Set case ownership and team routing.</p>

              <div className="form-grid-2">
                <div className="field-group">
                  <label>Assigned Owner</label>
                  <input
                    value={assignedOwnerValue}
                    onChange={(e) => setAssignedOwnerValue(e.target.value)}
                    placeholder="Taylor Smith"
                  />
                </div>

                <div className="field-group">
                  <label>Assigned Team</label>
                  <input
                    value={assignedTeamValue}
                    onChange={(e) => setAssignedTeamValue(e.target.value)}
                    placeholder="Fraud Operations"
                  />
                </div>
              </div>

              <div className="button-row" style={{ marginTop: "14px" }}>
                <button className="button" type="button" onClick={saveAssignment}>
                  Save Assignment
                </button>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Case Status</h3>
              <p className="workspace-subtle">Track the current handling stage.</p>

              <div className="field-group">
                <label>Update Status</label>
                <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                  <option value="New">New</option>
                  <option value="In Review">In Review</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="button-row" style={{ marginTop: "14px" }}>
                <button className="button" type="button" onClick={saveStatus}>
                  Save Status
                </button>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Member Context</h3>

              <div className="workspace-meta-grid">
                <div className="workspace-meta-item">
                  <div className="label">Member Name</div>
                  <div className="value">{caseData.full_name || "Not provided"}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Age Band</div>
                  <div className="value">{caseData.age_band}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Potentially Vulnerable Adult</div>
                  <div className="value">{caseData.vulnerable_adult_flag ? "Yes" : "No"}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Trusted Contact Exists</div>
                  <div className="value">{caseData.trusted_contact_exists ? "Yes" : "No"}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Trusted Contact Name</div>
                  <div className="value">{caseData.trusted_contact_name || "Not provided"}</div>
                </div>
                <div className="workspace-meta-item">
                  <div className="label">Trusted Contact Phone</div>
                  <div className="value">{caseData.trusted_contact_phone || "Not provided"}</div>
                </div>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Urgency Rationale</h3>

              <div className="readonly-box">
                <strong>Urgency score: {caseData.urgency_score}</strong>
                <ul className="workspace-list" style={{ marginTop: "10px" }}>
                  {caseData.urgency_reasons.map((reason: string, index: number) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Staff Notes</h3>
              <div className="field-group">
                <label>Case Notes</label>
                <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} />
              </div>

              <div className="button-row" style={{ marginTop: "14px" }}>
                <button className="button" type="button" onClick={saveNotes}>
                  Save Notes
                </button>
              </div>
            </section>

            <section className="workspace-panel">
              <h3 className="workspace-section-title">Case Resolution</h3>
              <p className="workspace-subtle">Record the final outcome and closure notes.</p>

              <div className="form-grid">
                <div className="field-group">
                  <label>Outcome Type</label>
                  <select value={outcomeValue} onChange={(e) => setOutcomeValue(e.target.value)}>
                    <option value="customer_protected">Customer Protected</option>
                    <option value="funds_blocked">Funds Blocked</option>
                    <option value="funds_lost">Funds Lost</option>
                    <option value="false_alarm">False Alarm</option>
                    <option value="follow_up_required">Follow Up Required</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Closure Notes</label>
                  <textarea value={closureNotesValue} onChange={(e) => setClosureNotesValue(e.target.value)} />
                </div>
              </div>

              <div className="button-row" style={{ marginTop: "14px" }}>
                <button className="button" type="button" onClick={closeCase}>
                  Close Case
                </button>
              </div>

              <div className="readonly-box" style={{ marginTop: "16px" }}>
                <strong>Recorded outcome</strong>
                <p style={{ margin: "8px 0 0" }}>{humanizeOutcome(caseData.outcome_type)}</p>
                <p style={{ margin: "8px 0 0" }}>
                  <strong>Recorded closure notes:</strong> {caseData.closure_notes || "Not set"}
                </p>
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
