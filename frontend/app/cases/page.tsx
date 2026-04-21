"use client";

import { useEffect, useMemo, useState } from "react";

function getSeverityClass(severity: string) {
  const value = severity.toLowerCase();
  if (value === "low") return "badge badge-low";
  if (value === "medium") return "badge badge-medium";
  if (value === "high") return "badge badge-high";
  return "badge badge-critical";
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

function getStatusClass(status: string) {
  if (status === "Closed") return "badge badge-low";
  if (status === "In Review") return "badge badge-medium";
  return "badge badge-high";
}

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchCases() {
      try {
        const response = await fetch("http://localhost:8000/api/cases");

        if (!response.ok) {
          throw new Error("Failed to load cases");
        }

        const data = await response.json();
        setCases(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      }
    }

    fetchCases();
  }, []);

  const filteredCases = useMemo(() => {
    let results = [...cases];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      results = results.filter((caseItem) => {
        const alertId = String(caseItem.alert_id || "").toLowerCase();
        const title = String(caseItem.title || "").toLowerCase();
        return alertId.includes(query) || title.includes(query);
      });
    }

    if (severityFilter !== "all") {
      results = results.filter(
        (caseItem) => String(caseItem.severity || "").toLowerCase() === severityFilter
      );
    }

    if (statusFilter !== "all") {
      results = results.filter(
        (caseItem) => String(caseItem.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return results;
  }, [cases, searchTerm, severityFilter, statusFilter]);

  return (
    <main>
      <h1>Saved Cases</h1>
      <p className="muted">Search, filter, and review previously analyzed alerts.</p>

      <div className="link-row">
        <a href="/">Back to Dashboard</a>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <div
          style={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <div>
            <label><strong>Search</strong></label>
            <input
              type="text"
              placeholder="Search by alert ID or title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginTop: "8px" }}
            />
          </div>

          <div>
            <label><strong>Severity Filter</strong></label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "white",
              }}
            >
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label><strong>Status Filter</strong></label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "white",
              }}
            >
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="in review">In Review</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <p className="muted" style={{ marginTop: "16px" }}>
          Showing {filteredCases.length} of {cases.length} cases
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="case-list">
        {filteredCases.map((caseItem) => (
          <div key={caseItem.id} className="card">
            <h2>{caseItem.title}</h2>
            <p><strong>ID:</strong> {caseItem.id}</p>
            <p><strong>Alert ID:</strong> {caseItem.alert_id}</p>
            <p><strong>Created:</strong> {formatTimestamp(caseItem.created_at)}</p>
            <p>
              <strong>Severity:</strong>{" "}
              <span className={getSeverityClass(caseItem.severity)}>{caseItem.severity}</span>
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={getStatusClass(caseItem.status)}>{caseItem.status}</span>
            </p>
            <p><strong>Score:</strong> {caseItem.score}</p>
            <p><strong>Summary:</strong> {caseItem.summary}</p>
            <p><strong>Notes:</strong> {caseItem.notes ? caseItem.notes : "No notes yet."}</p>

            <div className="link-row">
              <a href={`/cases/${caseItem.id}`}>View Case Details</a>
            </div>
          </div>
        ))}

        {!error && filteredCases.length === 0 && (
          <div className="card">
            <p>No cases matched your current search/filter.</p>
          </div>
        )}
      </div>
    </main>
  );
}
