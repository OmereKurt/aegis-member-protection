"use client";

import { useEffect, useState } from "react";

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
    <main>
      <div className="page-header">
        <h1>Management Reporting</h1>
        <p className="page-subtitle">
          Lightweight operational reporting for member protection case volume, outcomes, and intake source distribution.
        </p>

        <div className="nav-row">
          <a href="/ops">Back to Queue</a>
          <a href="/cases/new">Start New Intake</a>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {!summary && !error && <p className="muted">Loading reporting summary...</p>}

      {summary && (
        <div className="grid" style={{ gap: "24px" }}>
          <div className="stats-grid">
            <div className="card card-tight">
              <p className="muted">Total Cases</p>
              <h2>{summary.total_cases}</h2>
            </div>
            <div className="card card-tight">
              <p className="muted">Open Cases</p>
              <h2>{summary.open_cases}</h2>
            </div>
            <div className="card card-tight">
              <p className="muted">Closed Cases</p>
              <h2>{summary.closed_cases}</h2>
            </div>
            <div className="card card-tight">
              <p className="muted">Protected / Blocked</p>
              <h2>{summary.protected_or_blocked_cases}</h2>
            </div>
            <div className="card card-tight">
              <p className="muted">Funds Lost</p>
              <h2>{summary.funds_lost_cases}</h2>
            </div>
          </div>

          <div className="card">
            <h2>Cases by Source Unit</h2>
            <div className="case-list">
              {Object.entries(summary.source_unit_counts).map(([unit, count]) => (
                <div key={unit} className="summary-box">
                  <p><strong>{unit}</strong></p>
                  <p>{String(count)} case(s)</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Cases by Outcome</h2>
            <div className="case-list">
              {Object.entries(summary.outcome_counts).map(([outcome, count]) => (
                <div key={outcome} className="summary-box">
                  <p><strong>{outcome}</strong></p>
                  <p>{String(count)} case(s)</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
