"use client";

import { useEffect, useMemo, useState } from "react";

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

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function ReportingPage() {
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch("/backend/api/scam-cases/summary");

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

  const sourceUnitRows = useMemo(() => {
    if (!summary) return [];
    const entries = Object.entries(summary.source_unit_counts || {}) as [string, number][];
    return entries.sort((a, b) => b[1] - a[1]);
  }, [summary]);

  const outcomeRows = useMemo(() => {
    if (!summary) return [];
    const entries = Object.entries(summary.outcome_counts || {}) as [string, number][];
    return entries.sort((a, b) => b[1] - a[1]);
  }, [summary]);

  const maxSourceCount = useMemo(() => {
    if (!sourceUnitRows.length) return 1;
    return Math.max(...sourceUnitRows.map(([, count]) => count), 1);
  }, [sourceUnitRows]);

  const maxOutcomeCount = useMemo(() => {
    if (!outcomeRows.length) return 1;
    return Math.max(...outcomeRows.map(([, count]) => count), 1);
  }, [outcomeRows]);

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
              <div className="kpi-foot">Cases with recorded outcomes</div>
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

          <div className="visual-summary-grid">
            <div className="progress-card">
              <h3>Protection Snapshot</h3>
              <p>Quick readout of current case resolution mix.</p>

              <div className="dual-progress">
                <div className="dual-progress-row">
                  <div className="dual-progress-label">
                    <span>Open vs Closed</span>
                    <span>
                      {summary.open_cases} / {summary.closed_cases}
                    </span>
                  </div>
                  <div className="stacked-track">
                    <div
                      className="stacked-segment stacked-blue"
                      style={{
                        width: `${percentage(summary.open_cases, summary.total_cases || 1)}%`,
                      }}
                    />
                    <div
                      className="stacked-segment stacked-green"
                      style={{
                        width: `${percentage(summary.closed_cases, summary.total_cases || 1)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="dual-progress-row">
                  <div className="dual-progress-label">
                    <span>Protected / Blocked vs Lost</span>
                    <span>
                      {summary.protected_or_blocked_cases} / {summary.funds_lost_cases}
                    </span>
                  </div>
                  <div className="stacked-track">
                    <div
                      className="stacked-segment stacked-green"
                      style={{
                        width: `${percentage(
                          summary.protected_or_blocked_cases,
                          summary.protected_or_blocked_cases + summary.funds_lost_cases || 1
                        )}%`,
                      }}
                    />
                    <div
                      className="stacked-segment stacked-red"
                      style={{
                        width: `${percentage(
                          summary.funds_lost_cases,
                          summary.protected_or_blocked_cases + summary.funds_lost_cases || 1
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="ops-surface">
              <div className="ops-toolbar-title">
                <h2>Management Snapshot</h2>
                <p>High-level questions a manager usually wants answered fast.</p>
              </div>

              <div className="snapshot-list" style={{ marginTop: "16px" }}>
                <div className="snapshot-item">
                  <div className="snapshot-item-icon">1</div>
                  <div className="snapshot-item-text">
                    <strong>Where is case volume coming from?</strong>
                    <span>Use source-unit charts to identify which operational areas generate the most activity.</span>
                  </div>
                </div>

                <div className="snapshot-item">
                  <div className="snapshot-item-icon">2</div>
                  <div className="snapshot-item-text">
                    <strong>How are cases resolving?</strong>
                    <span>Track whether cases are ending in protection, blocked funds, loss, or unresolved states.</span>
                  </div>
                </div>

                <div className="snapshot-item">
                  <div className="snapshot-item-icon">3</div>
                  <div className="snapshot-item-text">
                    <strong>What needs attention now?</strong>
                    <span>Compare open, closed, and loss outcomes to spot where the workflow needs strengthening.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <h3>Cases by Source Unit</h3>
              <p>Which operational areas are generating the most case volume.</p>

              <div className="bar-list">
                {sourceUnitRows.map(([unit, count]) => (
                  <div key={unit} className="bar-row">
                    <div className="bar-label-row">
                      <span className="bar-label">{unit}</span>
                      <span className="bar-value">{count}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.max((count / maxSourceCount) * 100, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h3>Cases by Outcome</h3>
              <p>How cases are resolving across the current workflow.</p>

              <div className="bar-list">
                {outcomeRows.map(([outcome, count], index) => {
                  const colorClass =
                    index % 4 === 0 ? "green" : index % 4 === 1 ? "amber" : index % 4 === 2 ? "red" : "dark";

                  return (
                    <div key={outcome} className="bar-row">
                      <div className="bar-label-row">
                        <span className="bar-label">{humanizeOutcome(outcome)}</span>
                        <span className="bar-value">{count}</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${colorClass}`}
                          style={{ width: `${Math.max((count / maxOutcomeCount) * 100, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
