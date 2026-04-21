"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function HomePage() {
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [scamTypeFilter, setScamTypeFilter] = useState("all");

  async function loadCases() {
    try {
      const response = await fetch("http://localhost:8000/api/scam-cases/");

      if (!response.ok) {
        throw new Error("Failed to load cases");
      }

      const data = await response.json();
      setCases(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function quickUpdateStatus(caseId: number, status: string) {
    try {
      const response = await fetch(`http://localhost:8000/api/scam-cases/${caseId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await loadCases();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  const filteredCases = useMemo(() => {
    let results = [...cases];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      results = results.filter((caseItem) => {
        const caseId = String(caseItem.case_id || "").toLowerCase();
        const customerIdentifier = String(caseItem.customer_identifier || "").toLowerCase();
        const title = String(caseItem.title || "").toLowerCase();
        const sourceUnit = String(caseItem.source_unit || "").toLowerCase();
        return (
          caseId.includes(query) ||
          customerIdentifier.includes(query) ||
          title.includes(query) ||
          sourceUnit.includes(query)
        );
      });
    }

    if (statusFilter !== "all") {
      results = results.filter(
        (caseItem) => String(caseItem.status || "").toLowerCase() === statusFilter
      );
    }

    if (urgencyFilter !== "all") {
      results = results.filter(
        (caseItem) => String(caseItem.urgency || "").toLowerCase() === urgencyFilter
      );
    }

    if (scamTypeFilter !== "all") {
      results = results.filter(
        (caseItem) => String(caseItem.scam_type || "").toLowerCase() === scamTypeFilter
      );
    }

    return results;
  }, [cases, searchTerm, statusFilter, urgencyFilter, scamTypeFilter]);

  const urgencyCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };

    for (const caseItem of cases) {
      const urgency = String(caseItem.urgency || "").toLowerCase();
      if (urgency === "low") counts.low += 1;
      else if (urgency === "medium") counts.medium += 1;
      else if (urgency === "high") counts.high += 1;
      else if (urgency === "critical") counts.critical += 1;
    }

    return counts;
  }, [cases]);

  const statusCounts = useMemo(() => {
    const counts = { new: 0, inReview: 0, escalated: 0, closed: 0 };

    for (const caseItem of cases) {
      const status = String(caseItem.status || "").toLowerCase();
      if (status === "new") counts.new += 1;
      else if (status === "in review") counts.inReview += 1;
      else if (status === "escalated") counts.escalated += 1;
      else if (status === "closed") counts.closed += 1;
    }

    return counts;
  }, [cases]);

  return (
    <main>
      <div className="page-header">
        <h1>Member Protection Operations</h1>
        <p className="page-subtitle">
          Intake, triage, and manage suspected elder financial exploitation cases so staff can intervene before funds leave the institution.
        </p>

        <div className="nav-row">
          <a href="/cases/new">Start New Intake</a>
          <a href="/reporting">View Reporting</a>
        </div>
      </div>

      <div className="grid" style={{ gap: "24px" }}>
        <div className="stats-grid">
          <div className="card card-tight">
            <p className="muted">Open + Closed Cases</p>
            <h2>{cases.length}</h2>
          </div>
          <div className="card card-tight">
            <p className="muted">Low Urgency</p>
            <h2><span className="badge badge-low">{urgencyCounts.low}</span></h2>
          </div>
          <div className="card card-tight">
            <p className="muted">Medium Urgency</p>
            <h2><span className="badge badge-medium">{urgencyCounts.medium}</span></h2>
          </div>
          <div className="card card-tight">
            <p className="muted">High Urgency</p>
            <h2><span className="badge badge-high">{urgencyCounts.high}</span></h2>
          </div>
          <div className="card card-tight">
            <p className="muted">Critical Urgency</p>
            <h2><span className="badge badge-critical">{urgencyCounts.critical}</span></h2>
          </div>
        </div>

        <div className="stats-grid">
          <div className="card card-tight">
            <p className="muted">New</p>
            <h2><span className="badge badge-status-new">{statusCounts.new}</span></h2>
          </div>
          <div className="card card-tight">
            <p className="muted">In Review</p>
            <h2><span className="badge badge-status-review">{statusCounts.inReview}</span></h2>
          </div>
          <div className="card card-tight">
            <p className="muted">Escalated</p>
            <h2><span className="badge badge-status-escalated">{statusCounts.escalated}</span></h2>
          </div>
          <div className="card card-tight">
            <p className="muted">Closed</p>
            <h2><span className="badge badge-status-closed">{statusCounts.closed}</span></h2>
          </div>
        </div>

        <div className="card">
          <h2>Case Queue</h2>

          <div className="form-grid-2" style={{ marginTop: "16px" }}>
            <div className="field-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by case ID, member ID, title, or source unit"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="in review">In Review</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="field-group">
              <label>Urgency</label>
              <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
                <option value="all">All urgencies</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="field-group">
              <label>Case Type</label>
              <select value={scamTypeFilter} onChange={(e) => setScamTypeFilter(e.target.value)}>
                <option value="all">All case types</option>
                <option value="bank_imposter">Bank Imposter</option>
                <option value="government_imposter">Government Imposter</option>
                <option value="tech_support">Tech Support</option>
                <option value="family_emergency">Family Emergency</option>
                <option value="investment_crypto">Investment / Crypto</option>
                <option value="romance">Romance</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <p className="muted" style={{ marginTop: "16px" }}>
            Showing {filteredCases.length} of {cases.length} cases
          </p>

          {error && <p className="error">{error}</p>}

          <div className="case-list">
            {filteredCases.map((caseItem) => (
              <div key={caseItem.id} className="summary-box">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <p><strong>{caseItem.title}</strong></p>
                    <p className="muted">Case ID: {caseItem.case_id}</p>
                  </div>
                  <div className="nav-row" style={{ marginTop: 0 }}>
                    <span className={urgencyClass(caseItem.urgency)}>{caseItem.urgency}</span>
                    <span className={statusClass(caseItem.status)}>{caseItem.status}</span>
                  </div>
                </div>

                <div className="case-meta">
                  <p><strong>Member ID:</strong> {caseItem.customer_identifier}</p>
                  <p><strong>Source Unit:</strong> {caseItem.source_unit}</p>
                  <p><strong>Case Type:</strong> {humanizeScamType(caseItem.scam_type)}</p>
                  <p><strong>Potential Loss:</strong> ${Number(caseItem.amount_at_risk || 0).toLocaleString()}</p>
                  <p><strong>Created:</strong> {formatTimestamp(caseItem.created_at)}</p>
                </div>

                <p className="muted">
                  {caseItem.notes ? `Case notes: ${caseItem.notes}` : "No case notes yet."}
                </p>

                <div className="button-row">
                  <a href={`/cases/${caseItem.id}`} className="button">
                    Open Case
                  </a>

                  {String(caseItem.status) !== "In Review" && String(caseItem.status) !== "Closed" && (
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => quickUpdateStatus(caseItem.id, "In Review")}
                    >
                      Move to Review
                    </button>
                  )}

                  {String(caseItem.status) !== "Escalated" && String(caseItem.status) !== "Closed" && (
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => quickUpdateStatus(caseItem.id, "Escalated")}
                    >
                      Escalate
                    </button>
                  )}
                </div>
              </div>
            ))}

            {!error && filteredCases.length === 0 && (
              <div className="summary-box">
                <p>No cases matched your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
