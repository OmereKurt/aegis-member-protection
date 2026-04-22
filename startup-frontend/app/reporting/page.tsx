"use client";

import { useEffect, useState } from "react";

function humanizeOutcome(value: string) {
  const map: Record<string, string> = {
    customer_protected: "Customer Protected",
    funds_blocked: "Funds Blocked",
    funds_lost: "Funds Lost",
    false_alarm: "False Alarm",
    follow_up_required: "Follow Up Required",
    unknown: "Unknown",
    unset: "Not Yet Closed",
  };
  return map[value] || value;
}

export default function ReportingPage() {
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch("http://localhost:8000/api/scam-cases/summary");

        if (!response.ok) {
          throw new Error("Failed to load reporting summary");
        }

        const data = await response.json();
        setSummary(data);
        setError("");
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      }
    }

    loadSummary();
  }, []);

  return (
    <main className="page-wrap">
      <div className="page-header">
        <div className="page-kicker">Management Reporting</div>
        <h1 className="page-title">Operational Reporting</h1>
        <p className="page-subtitle">
          Review case volume, source-unit distribution, and member protection outcomes across the workflow.
        </p>

        <div className="nav-row" style={{ marginTop: "16px" }}>
          <a href="/ops">Back to Operations</a>
          <a href="/cases/new">Start New Intake</a>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {!summary && !error && <p className="muted">Loading reporting summary...</p>}

      {summary && (
        <div className="grid" style={{ gap: "22px" }}>
          <div className="kpi-strip">
            <div className="kpi-card">
              <div className="kpi-label">Total Cases</div>
              <div className="kpi-value">{summary.total_cases}</div>
              <div className="kpi-foot">All recorded cases in the workflow</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Open Cases</div>
              <div className="kpi-value">{summary.open_cases}</div>
              <div className="kpi-foot">Cases not yet closed</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Closed Cases</div>
              <div className="kpi-value">{summary.closed_cases}</div>
              <div className="kpi-foot">Cases with recorded outcome state</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Protected / Blocked</div>
              <div className="kpi-value">{summary.protected_or_blocked_cases}</div>
              <div className="kpi-foot">Members protected before full loss</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Funds Lost</div>
              <div className="kpi-value">{summary.funds_lost_cases}</div>
              <div className="kpi-foot">Cases where loss was recorded</div>
            </div>
          </div>

          <div className="reporting-grid">
            <div className="ops-surface">
              <div className="ops-toolbar-title">
                <h2>Cases by Source Unit</h2>
                <p>Which operational areas are generating the most case volume.</p>
              </div>

              <div className="reporting-list" style={{ marginTop: "16px" }}>
                {Object.entries(summary.source_unit_counts).map(([unit, count]) => (
                  <div key={unit} className="reporting-row">
                    <div className="reporting-row-label">{unit}</div>
                    <div className="reporting-row-value">{String(count)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ops-surface">
              <div className="ops-toolbar-title">
                <h2>Cases by Outcome</h2>
                <p>How cases are resolving across the current workflow.</p>
              </div>

              <div className="reporting-list" style={{ marginTop: "16px" }}>
                {Object.entries(summary.outcome_counts).map(([outcome, count]) => (
                  <div key={outcome} className="reporting-row">
                    <div className="reporting-row-label">{humanizeOutcome(outcome)}</div>
                    <div className="reporting-row-value">{String(count)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
