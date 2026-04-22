"use client";

import { useEffect, useState } from "react";

function getSeverityClass(severity: string) {
  const value = severity.toLowerCase();
  if (value === "low") return "badge badge-low";
  if (value === "medium") return "badge badge-medium";
  if (value === "high") return "badge badge-high";
  return "badge badge-critical";
}

function getStatusClass(status: string) {
  if (status === "Closed") return "badge badge-low";
  if (status === "In Review") return "badge badge-medium";
  return "badge badge-high";
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [caseData, setCaseData] = useState<any>(null);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState<string>("");
  const [statusValue, setStatusValue] = useState("New");
  const [notesValue, setNotesValue] = useState("");

  useEffect(() => {
    async function loadParamsAndFetchCase() {
      const resolvedParams = await params;
      setCaseId(resolvedParams.id);

      try {
        const response = await fetch(`http://localhost:8000/api/cases/${resolvedParams.id}`);

        if (!response.ok) {
          throw new Error("Failed to load case");
        }

        const data = await response.json();
        setCaseData(data);
        setStatusValue(data.status);
        setNotesValue(data.notes || "");
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      }
    }

    loadParamsAndFetchCase();
  }, [params]);

  async function updateStatus() {
    try {
      const response = await fetch(`http://localhost:8000/api/cases/${caseId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: statusValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setCaseData((prev: any) => ({
        ...prev,
        status: statusValue,
      }));
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  async function updateNotes() {
    try {
      const response = await fetch(`http://localhost:8000/api/cases/${caseId}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notes");
      }

      setCaseData((prev: any) => ({
        ...prev,
        notes: notesValue,
      }));
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <main>
      <h1>Case Details</h1>
      <div className="link-row">
        <a href="/cases">Back to Cases</a>
      </div>

      {error && <p className="error">{error}</p>}
      {!caseData && !error && <p className="muted">Loading case {caseId ? `#${caseId}` : ""}...</p>}

      {caseData && (
        <div className="card" style={{ marginTop: "24px" }}>
          <p><strong>ID:</strong> {caseData.id}</p>
          <p><strong>Alert ID:</strong> {caseData.alert_id}</p>
          <p><strong>Created:</strong> {formatTimestamp(caseData.created_at)}</p>
          <p><strong>Title:</strong> {caseData.title}</p>
          <p>
            <strong>Severity:</strong>{" "}
            <span className={getSeverityClass(caseData.severity)}>{caseData.severity}</span>
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={getStatusClass(caseData.status)}>{caseData.status}</span>
          </p>
          <p><strong>Score:</strong> {caseData.score}</p>
          <p><strong>Summary:</strong> {caseData.summary}</p>

          <div style={{ marginTop: "20px" }}>
            <label><strong>Update Status</strong></label>
            <div className="link-row" style={{ alignItems: "center" }}>
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "white",
                }}
              >
                <option value="New">New</option>
                <option value="In Review">In Review</option>
                <option value="Closed">Closed</option>
              </select>

              <button className="button" type="button" onClick={updateStatus}>
                Save Status
              </button>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <label><strong>Analyst Notes</strong></label>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={6}
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "white",
                resize: "vertical",
              }}
            />
            <div className="link-row">
              <button className="button" type="button" onClick={updateNotes}>
                Save Notes
              </button>
            </div>
          </div>

          <h3 className="section-title">Reasons</h3>
          <ul>
            {caseData.reasons.map((reason: string, index: number) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>

          <h3 className="section-title">Recommended Actions</h3>
          <ul>
            {caseData.recommended_actions.map((action: string, index: number) => (
              <li key={index}>{action}</li>
            ))}
          </ul>

          <h3 className="section-title">Normalized Alert</h3>
          <pre>{JSON.stringify(caseData.normalized_alert, null, 2)}</pre>

          <h3 className="section-title">Enrichment</h3>
          <pre>{JSON.stringify(caseData.enrichment, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
