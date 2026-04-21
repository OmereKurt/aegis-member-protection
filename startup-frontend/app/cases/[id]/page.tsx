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

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = String(params.id);

  const [caseData, setCaseData] = useState<any>(null);
  const [error, setError] = useState("");
  const [statusValue, setStatusValue] = useState("New");
  const [notesValue, setNotesValue] = useState("");
  const [outcomeValue, setOutcomeValue] = useState("unknown");
  const [closureNotesValue, setClosureNotesValue] = useState("");

  async function loadCase() {
    try {
      const response = await fetch(`http://localhost:8000/api/scam-cases/${caseId}`);

      if (!response.ok) {
        throw new Error("Failed to load case");
      }

      const data = await response.json();
      setCaseData(data);
      setStatusValue(data.status);
      setNotesValue(data.notes || "");
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
      const response = await fetch(`http://localhost:8000/api/scam-cases/${caseId}/status`, {
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
      const response = await fetch(`http://localhost:8000/api/scam-cases/${caseId}/notes`, {
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

  async function closeCase() {
    if (!closureNotesValue.trim()) {
      setError("Closure notes are required before closing a case.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/scam-cases/${caseId}/close`, {
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
      const response = await fetch(`http://localhost:8000/api/scam-cases/${caseId}/status`, {
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
    <main>
      <div className="page-header">
        <h1>Member Protection Case Workspace</h1>
        <p className="page-subtitle">
          Review the member situation, guide the intervention, document staff handling, and record the final outcome.
        </p>

        <div className="nav-row">
          <a href="/">Back to Queue</a>
          <a href="/cases/new">Start New Intake</a>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {!caseData && !error && <p className="muted">Loading case...</p>}

      {caseData && (
        <div className="grid">
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <h2>{caseData.title}</h2>
                <p className="muted">{caseData.case_id}</p>
              </div>

              <div className="nav-row" style={{ marginTop: 0 }}>
                <span className={urgencyClass(caseData.urgency)}>{caseData.urgency}</span>
                <span className={statusClass(caseData.status)}>{caseData.status}</span>
              </div>
            </div>

            <div className="case-meta" style={{ marginTop: "16px" }}>
              <p><strong>Member ID:</strong> {caseData.customer_identifier}</p>
              <p><strong>Case Type:</strong> {humanizeScamType(caseData.scam_type)}</p>
              <p><strong>Potential Loss:</strong> ${Number(caseData.amount_at_risk || 0).toLocaleString()}</p>
              <p><strong>Created:</strong> {formatTimestamp(caseData.created_at)}</p>
              <p><strong>Updated:</strong> {formatTimestamp(caseData.updated_at)}</p>
              <p><strong>Urgency Score:</strong> {caseData.urgency_score}</p>
              <p><strong>Source Unit:</strong> {caseData.source_unit}</p>
            </div>

            <div className="button-row">
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

            <p style={{ marginTop: "14px" }}><strong>Case Summary:</strong> {caseData.summary}</p>
          </div>

          <div className="card">
            <h2>Immediate Staff Guidance</h2>

            <div className="summary-box" style={{ marginTop: "12px" }}>
              <p><strong>Use these actions first</strong></p>
              <ul>
                {caseData.playbook.recommended_actions.slice(0, 3).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <div className="case-meta">
                <p><strong>Escalation Required:</strong> {caseData.playbook.escalation_required ? "Yes" : "No"}</p>
                <p><strong>Transaction Hold Likely Needed:</strong> {caseData.playbook.hold_recommended ? "Yes" : "No"}</p>
                <p><strong>Trusted Contact Outreach Recommended:</strong> {caseData.playbook.trusted_contact_recommended ? "Yes" : "No"}</p>
                <p><strong>External Reporting May Be Needed:</strong> {caseData.playbook.law_enforcement_reporting_recommended ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Member Context</h2>
            <div className="case-meta">
              <p><strong>Member Name:</strong> {caseData.full_name || "Not provided"}</p>
              <p><strong>Age Band:</strong> {caseData.age_band}</p>
              <p><strong>Potentially Vulnerable Adult:</strong> {caseData.vulnerable_adult_flag ? "Yes" : "No"}</p>
              <p><strong>Trusted Contact Exists:</strong> {caseData.trusted_contact_exists ? "Yes" : "No"}</p>
              <p><strong>Trusted Contact Name:</strong> {caseData.trusted_contact_name || "Not provided"}</p>
              <p><strong>Trusted Contact Phone:</strong> {caseData.trusted_contact_phone || "Not provided"}</p>
            </div>
          </div>

          <div className="card">
            <h2>Reported Event Details</h2>
            <div className="case-meta">
              <p><strong>Intake Channel:</strong> {caseData.intake_channel}</p>
              <p><strong>Transaction Type:</strong> {caseData.transaction_type}</p>
              <p><strong>Funds Already Left:</strong> {caseData.money_already_left ? "Yes" : "No"}</p>
              <p><strong>Live Contact with Scammer:</strong> {caseData.customer_currently_on_call_with_scammer ? "Yes" : "No"}</p>
              <p><strong>New Payee/Destination:</strong> {caseData.new_payee_or_destination ? "Yes" : "No"}</p>
              <p><strong>Secrecy Pressure:</strong> {caseData.customer_told_to_keep_secret ? "Yes" : "No"}</p>
            </div>

            <p><strong>Staff Narrative:</strong> {caseData.narrative}</p>
          </div>

          <div className="card">
            <h2>Urgency Rationale</h2>

            <h3 className="section-title">Why this case was prioritized this way</h3>
            <ul>
              {caseData.urgency_reasons.map((reason: string, index: number) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>

            <h3 className="section-title">Structured Risk Indicators</h3>
            <pre>{JSON.stringify(caseData.risk_factors, null, 2)}</pre>
          </div>

          <div className="card">
            <h2>Intervention Questions and Actions</h2>

            <h3 className="section-title">Questions for the member</h3>
            <ul>
              {caseData.playbook.recommended_questions.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="section-title">Recommended staff actions</h3>
            <ul>
              {caseData.playbook.recommended_actions.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Case Status</h2>
            <div className="field-group" style={{ maxWidth: "320px", marginTop: "12px" }}>
              <label>Update Status</label>
              <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                <option value="New">New</option>
                <option value="In Review">In Review</option>
                <option value="Escalated">Escalated</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="button-row">
              <button className="button" type="button" onClick={saveStatus}>
                Save Status
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Staff Notes</h2>
            <div className="field-group" style={{ marginTop: "12px" }}>
              <label>Case Notes</label>
              <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} />
            </div>

            <div className="button-row">
              <button className="button" type="button" onClick={saveNotes}>
                Save Notes
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Case Resolution</h2>

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

            <div className="button-row">
              <button className="button" type="button" onClick={closeCase}>
                Close Case
              </button>
            </div>

            <div style={{ marginTop: "12px" }}>
              <p><strong>Recorded Outcome:</strong> {caseData.outcome_type || "Not set"}</p>
              <p><strong>Recorded Closure Notes:</strong> {caseData.closure_notes || "Not set"}</p>
            </div>
          </div>

          <div className="card">
            <h2>Case Activity Timeline</h2>

            {caseData.action_logs.length === 0 ? (
              <p className="muted">No activity logged yet.</p>
            ) : (
              <div className="case-list">
                {caseData.action_logs.map((log: any) => (
                  <div key={log.id} className="summary-box">
                    <p><strong>{log.action_type}</strong></p>
                    <p className="muted">{formatTimestamp(log.created_at)}</p>
                    <p>{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
