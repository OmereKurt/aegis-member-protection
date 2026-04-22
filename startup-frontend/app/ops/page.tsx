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

export default function OpsPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [scamTypeFilter, setScamTypeFilter] = useState("all");

  async function loadCases() {
    try {
      const response = await fetch("/backend/api/scam-cases/");

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
      const response = await fetch(`/backend/api/scam-cases/${caseId}/status`, {
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
        const assignedOwner = String(caseItem.assigned_owner || "").toLowerCase();
        const assignedTeam = String(caseItem.assigned_team || "").toLowerCase();
        return (
          caseId.includes(query) ||
          customerIdentifier.includes(query) ||
          title.includes(query) ||
          sourceUnit.includes(query) ||
          assignedOwner.includes(query) ||
          assignedTeam.includes(query)
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
    <main className="page-wrap">
      <div className="page-header">
        <div className="page-kicker">Operations Workspace</div>
        <h1 className="page-title">Member Protection Operations</h1>
        <p className="page-subtitle">
          Review active member protection cases, update workflow status, and coordinate escalation across source units and teams.
        </p>

        <div className="nav-row" style={{ marginTop: "16px" }}>
          <a href="/cases/new">Start New Intake</a>
          <a href="/reporting">View Reporting</a>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">Total Cases</div>
          <div className="kpi-value">{cases.length}</div>
          <div className="kpi-foot">All open and closed records</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">New / In Review</div>
          <div className="kpi-value">{statusCounts.new + statusCounts.inReview}</div>
          <div className="kpi-foot">Cases currently in active handling</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Escalated</div>
          <div className="kpi-value">{statusCounts.escalated}</div>
          <div className="kpi-foot">Cases escalated for higher-touch review</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Critical Urgency</div>
          <div className="kpi-value">{urgencyCounts.critical}</div>
          <div className="kpi-foot">Most urgent cases requiring rapid intervention</div>
        </div>
      </div>

      <div className="ops-toolbar ops-surface" style={{ marginTop: "22px" }}>
        <div className="ops-toolbar-top">
          <div className="ops-toolbar-title">
            <h2>Case Queue</h2>
            <p>Search, filter, and work active cases across branches, contact center, and fraud operations.</p>
          </div>

          <div className="inline-badge-row">
            <span className="badge badge-status-new">New {statusCounts.new}</span>
            <span className="badge badge-status-review">In Review {statusCounts.inReview}</span>
            <span className="badge badge-status-escalated">Escalated {statusCounts.escalated}</span>
            <span className="badge badge-status-closed">Closed {statusCounts.closed}</span>
          </div>
        </div>

        <div className="ops-filter-grid">
          <div className="field-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Case ID, member, title, source unit, owner, or team"
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

        <p className="muted" style={{ marginTop: "6px" }}>
          Showing {filteredCases.length} of {cases.length} cases
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="ops-surface" style={{ marginTop: "18px" }}>
        <div className="queue-table-wrap">
          <table className="queue-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Source</th>
                <th>Ownership</th>
                <th>Urgency / Status</th>
                <th>Potential Loss</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((caseItem) => (
                <tr key={caseItem.id}>
                  <td>
                    <div className="queue-title">
                      <strong>{caseItem.title}</strong>
                      <span className="queue-subtext">{caseItem.case_id}</span>
                      <span className="queue-subtext">
                        Member: {caseItem.customer_identifier} • {humanizeScamType(caseItem.scam_type)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>{caseItem.source_unit}</strong>
                  </td>
                  <td>
                    <div className="queue-title">
                      <strong>{caseItem.assigned_owner || "Unassigned"}</strong>
                      <span className="queue-subtext">{caseItem.assigned_team || "No team assigned"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="inline-badge-row">
                      <span className={urgencyClass(caseItem.urgency)}>{caseItem.urgency}</span>
                      <span className={statusClass(caseItem.status)}>{caseItem.status}</span>
                    </div>
                  </td>
                  <td>${Number(caseItem.amount_at_risk || 0).toLocaleString()}</td>
                  <td>{formatTimestamp(caseItem.created_at)}</td>
                  <td>
                    <div className="button-row">
                      <a href={`/cases/${caseItem.id}`} className="button">
                        Open
                      </a>

                      {String(caseItem.status) !== "In Review" && String(caseItem.status) !== "Closed" && (
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => quickUpdateStatus(caseItem.id, "In Review")}
                        >
                          Review
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!error && filteredCases.length === 0 && (
            <div className="summary-box" style={{ marginTop: "16px" }}>
              <p>No cases matched your filters.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
