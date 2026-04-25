"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  deleteCase,
  listCases,
  resetDemoData,
  seedDemoData,
  toQueueCase,
  type CaseIntelligence,
  type QueueCase as CaseItem,
} from "../lib/cases";
import { fallbackCases } from "../lib/fallbackCases";

const defaultIntelligence: CaseIntelligence = {
  likely_pattern_code: "unknown",
  likely_pattern: "Unknown / other",
  signal_strength: "Limited",
  risk_drivers: ["Review the intake narrative and operator notes."],
  missing_information: ["Additional structured intelligence is not available for this demo case."],
  recommended_next_steps: ["Document the member conversation and assign the next owner."],
  suggested_escalation_path: ["Move the case into active review if staff concern remains."],
  structured_signals: [],
  why_high_risk: ["No backend intelligence record is attached to this case."],
};

function riskBadgeClass(risk: string) {
  switch (risk.toLowerCase()) {
    case "low":
      return "badge badge-low";
    case "medium":
      return "badge badge-medium";
    case "high":
      return "badge badge-high";
    case "critical":
      return "badge badge-critical";
    default:
      return "badge";
  }
}

function statusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "new":
      return "badge badge-status-new";
    case "review":
      return "badge badge-status-review";
    case "escalated":
      return "badge badge-status-escalated";
    case "closed":
      return "badge badge-status-closed";
    default:
      return "badge";
  }
}

function percent(count: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

export default function OperationsPage() {
  const [cases, setCases] = useState<CaseItem[]>(fallbackCases);
  const [selectedCaseId, setSelectedCaseId] = useState(fallbackCases[0]?.id || "");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionInFlight, setActionInFlight] = useState(false);

  const [sourceFilter, setSourceFilter] = useState("All source units");
  const [riskFilter, setRiskFilter] = useState("All risk levels");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [teamFilter, setTeamFilter] = useState("All teams");

  const [actionFeedback, setActionFeedback] = useState("");

  async function loadCases(preferredCaseId?: string) {
    try {
      setIsLoading(true);
      const records = await listCases();
      const mapped = records.map(toQueueCase);
      setCases(mapped);
      setLoadError("");

      const selectedFromUrl =
        preferredCaseId || new URLSearchParams(window.location.search).get("selected");

      if (selectedFromUrl && mapped.some((item) => item.id === selectedFromUrl)) {
        setSelectedCaseId(selectedFromUrl);
        setActionFeedback(`New intake ${selectedFromUrl} added to the queue.`);
        window.history.replaceState(null, "", "/ops");
      } else if (mapped.length > 0 && !mapped.some((item) => item.id === selectedCaseId)) {
        setSelectedCaseId(mapped[0].id);
      } else if (mapped.length === 0) {
        setSelectedCaseId("");
      }
    } catch {
      setLoadError("Unable to reach the backend. Showing the built-in demo queue.");
      setCases(fallbackCases);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCases();
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredQueue = useMemo(() => {
    return cases.filter((item) => {
      const sourceMatch =
        sourceFilter === "All source units" || item.sourceGroup === sourceFilter;
      const riskMatch = riskFilter === "All risk levels" || item.risk === riskFilter;
      const statusMatch = statusFilter === "All statuses" || item.status === statusFilter;
      const teamMatch = teamFilter === "All teams" || item.owner === teamFilter;

      return sourceMatch && riskMatch && statusMatch && teamMatch;
    });
  }, [cases, sourceFilter, riskFilter, statusFilter, teamFilter]);

  useEffect(() => {
    if (filteredQueue.some((item) => item.id === selectedCaseId)) return;
    if (filteredQueue.length === 0) return;

    const timeout = window.setTimeout(() => {
      setSelectedCaseId(filteredQueue[0].id);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [filteredQueue, selectedCaseId]);

  const selectedCase =
    filteredQueue.find((item) => item.id === selectedCaseId) ??
    cases.find((item) => item.id === selectedCaseId);
  const selectedIntelligence = selectedCase?.intelligence || defaultIntelligence;
  const previewSignals = selectedIntelligence.structured_signals
    .filter((signal) => signal.present)
    .slice(0, 2);

  const openCases = filteredQueue.filter((item) => item.status !== "Closed").length;
  const escalatedToday = filteredQueue.filter((item) => item.status === "Escalated").length;
  const branchShare = percent(
    filteredQueue.filter((item) => item.sourceGroup === "Branch network").length,
    filteredQueue.length
  );

  const sourceSnapshot = [
    {
      label: "Branch-originated cases",
      value: percent(
        filteredQueue.filter((item) => item.sourceGroup === "Branch network").length,
        filteredQueue.length
      ),
    },
    {
      label: "Contact center cases",
      value: percent(
        filteredQueue.filter((item) => item.sourceGroup === "Contact center").length,
        filteredQueue.length
      ),
    },
    {
      label: "Digital / self-service cases",
      value: percent(
        filteredQueue.filter((item) => item.sourceGroup === "Digital banking").length,
        filteredQueue.length
      ),
    },
  ];

  async function handleDeleteSelectedCase() {
    if (!selectedCase?.backendId) {
      setActionFeedback("Select a backend-backed case before deleting.");
      return;
    }

    try {
      setActionInFlight(true);
      const deletedId = selectedCase.id;
      const nextCase =
        filteredQueue.find((item) => item.id !== deletedId) ??
        cases.find((item) => item.id !== deletedId);

      await deleteCase(selectedCase.backendId);
      setSelectedCaseId(nextCase?.id || "");
      await loadCases(nextCase?.id);
      setActionFeedback(`Deleted ${selectedCase.caseNumber || selectedCase.id}.`);
    } catch {
      setActionFeedback("Unable to delete the selected case right now.");
    } finally {
      setActionInFlight(false);
    }
  }

  async function handleResetDemoData() {
    try {
      setActionInFlight(true);
      await resetDemoData();
      setSelectedCaseId("");
      await loadCases();
      setActionFeedback("Demo data reset. The shared queue is now clean.");
    } catch {
      setActionFeedback("Unable to reset demo data right now.");
    } finally {
      setActionInFlight(false);
    }
  }

  async function handleSeedDemoData() {
    try {
      setActionInFlight(true);
      const result = await seedDemoData();
      await loadCases();
      setActionFeedback(`Seeded ${result.seeded_cases} curated demo cases for Reporting and screenshots.`);
    } catch {
      setActionFeedback("Unable to seed demo data right now.");
    } finally {
      setActionInFlight(false);
    }
  }

  return (
    <main className="page-wrap ops-page-wrap">
      <section className="page-header">
        <div className="page-kicker">Operations workspace</div>
        <h1 className="page-title">Case queue and operator workspace</h1>
        <p className="page-subtitle">
          Review active cases, assess urgency, coordinate escalation, and keep
          ownership clear across branch, contact center, and fraud operations.
        </p>
      </section>

      <section className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">Open cases</div>
          <div className="kpi-value">{openCases}</div>
          <div className="kpi-foot">Within the current filtered view</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Escalated now</div>
          <div className="kpi-value">{escalatedToday}</div>
          <div className="kpi-foot">Supervisor or fraud review</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Median triage time</div>
          <div className="kpi-value">14m</div>
          <div className="kpi-foot">From intake to first review</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Branch-generated</div>
          <div className="kpi-value">{branchShare}</div>
          <div className="kpi-foot">Share of current queue view</div>
        </div>
      </section>

      <section className="ops-dashboard-grid">
        <div className="ops-main-column">
          <div className="ops-surface">
            <div className="ops-toolbar-top">
              <div className="ops-toolbar-title">
                <h2>Active queue</h2>
                <p>
                  Select a case to update the focused workspace on the right.
                </p>
              </div>

              <div className="button-row">
                <Link href="/cases/new" className="button">
                  Start New Intake
                </Link>
                <Link href="/reporting" className="button button-secondary">
                  Open Reporting
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="ops-inline-banner">
                Loading live cases from the backend...
              </div>
            ) : null}

            {loadError ? (
              <div className="ops-inline-banner">{loadError}</div>
            ) : null}

            {actionFeedback ? (
              <div className="ops-inline-banner">{actionFeedback}</div>
            ) : null}

            <div className="ops-filter-grid">
              <div className="field-group">
                <label>Source unit</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option>All source units</option>
                  <option>Branch network</option>
                  <option>Contact center</option>
                  <option>Digital banking</option>
                </select>
              </div>

              <div className="field-group">
                <label>Risk level</label>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                >
                  <option>All risk levels</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div className="field-group">
                <label>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All statuses</option>
                  <option>New</option>
                  <option>Review</option>
                  <option>Escalated</option>
                  <option>Closed</option>
                </select>
              </div>

              <div className="field-group">
                <label>Assigned team</label>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option>All teams</option>
                  <option>Fraud Ops</option>
                  <option>Member Protection</option>
                  <option>Branch Ops</option>
                  <option>Queue</option>
                </select>
              </div>
            </div>

            <div className="queue-table-wrap">
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Source</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Age</th>
                    <th>Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="queue-empty">
                        {cases.length === 0 ? (
                          <div>
                            <strong>No active cases yet.</strong>
                            <div className="muted" style={{ marginTop: 8 }}>
                              Start a new intake to create the first case and begin the workflow.
                            </div>
                            <div className="button-row" style={{ marginTop: 14 }}>
                              <Link href="/cases/new" className="button">
                                Start New Intake
                              </Link>
                              <Link href="/reporting" className="button button-secondary">
                                Open Reporting
                              </Link>
                            </div>
                          </div>
                        ) : (
                          "No cases match the current filters."
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => (
                      <tr
                        key={item.id}
                        className={item.id === selectedCase?.id ? "is-selected" : ""}
                        onClick={() => {
                          setSelectedCaseId(item.id);
                          setActionFeedback("");
                        }}
                      >
                        <td>
                          <div className="queue-title">
                            <Link href={`/cases/${item.backendId || item.id}`}>{item.title}</Link>
                            <span className="queue-subtext">
                              {item.caseNumber || item.id} · {item.member}
                            </span>
                          </div>
                        </td>
                        <td>{item.source}</td>
                        <td>
                          <span className={riskBadgeClass(item.risk)}>
                            {item.risk}
                          </span>
                        </td>
                        <td>
                          <span className={statusBadgeClass(item.status)}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.owner}</td>
                        <td>{item.age}</td>
                        <td>{item.nextStep}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="ops-side-column">
          <div className="workspace-hero sticky-case-panel ops-quick-preview">
            {selectedCase ? (
              <>
                <div className="workspace-title-row">
                  <div className="workspace-title-block">
                    <h2>Quick preview</h2>
                    <p className="workspace-subtle">
                      Select and open the full workspace when ready to act.
                    </p>
                  </div>

                  <div className="inline-badge-row">
                    <span className={riskBadgeClass(selectedCase.risk)}>
                      {selectedCase.risk}
                    </span>
                    <span className={statusBadgeClass(selectedCase.status)}>
                      {selectedCase.status}
                    </span>
                  </div>
                </div>

                <div className="workspace-meta-grid">
                  <div className="workspace-meta-item">
                    <div className="label">Case ID</div>
                    <div className="value">{selectedCase.caseNumber || selectedCase.id}</div>
                  </div>

                  <div className="workspace-meta-item">
                    <div className="label">Source unit</div>
                    <div className="value">{selectedCase.source}</div>
                  </div>

                  <div className="workspace-meta-item">
                    <div className="label">Assigned team</div>
                    <div className="value">{selectedCase.owner}</div>
                  </div>

                  <div className="workspace-meta-item">
                    <div className="label">Likely pattern</div>
                    <div className="value">{selectedIntelligence.likely_pattern}</div>
                  </div>
                </div>

                <div className="focused-case-stack">
                  <div>
                    <p className="workspace-subtle">{selectedCase.summary}</p>
                  </div>

                  {previewSignals.length ? (
                    <div className="ops-preview-signal-list">
                      {previewSignals.map((signal) => (
                        <div className="ops-preview-signal" key={signal.label}>
                          <span>{signal.label}</span>
                          <strong>{signal.severity}</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {selectedCase.status === "Closed" ? (
                    <div className="closure-summary-box">
                      <h3 className="workspace-section-title">Closure outcome</h3>
                      <div className="reporting-row">
                        <div className="reporting-row-label">Outcome</div>
                        <div className="reporting-row-value">{selectedCase.closure?.outcomeLabel}</div>
                      </div>
                      <p className="workspace-subtle">
                        {selectedCase.closure?.closureSummary || "No closure summary recorded."}
                      </p>
                    </div>
                  ) : null}

                  <Link
                    href={`/cases/${selectedCase.backendId || selectedCase.id}`}
                    className="button open-full-case-button"
                  >
                    Open Full Case
                  </Link>
                </div>

                <div className="action-grid">
                  <div className="demo-cleanup-inline">
                    <button
                      type="button"
                      className="button button-secondary button-compact"
                      onClick={handleDeleteSelectedCase}
                      disabled={actionInFlight || !selectedCase}
                    >
                      Delete selected case
                    </button>
                    <button
                      type="button"
                      className="button button-secondary button-compact"
                      onClick={handleResetDemoData}
                      disabled={actionInFlight}
                    >
                      Reset Demo Data
                    </button>
                    <button
                      type="button"
                      className="button button-secondary button-compact"
                      onClick={handleSeedDemoData}
                      disabled={actionInFlight}
                    >
                      Seed Demo Data
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="focused-case-stack">
                <div className="workspace-title-block">
                  <h2>Focused case view</h2>
                  <p className="workspace-subtle">
                    No case is selected. Start a new intake to create the first case or
                    load sample data to begin.
                  </p>
                </div>

                <div className="button-row">
                  <Link href="/cases/new" className="button">
                    Start New Intake
                  </Link>
                  <Link href="/reporting" className="button button-secondary">
                    Open Reporting
                  </Link>
                </div>

                <div className="demo-cleanup-inline">
                  <button
                    type="button"
                    className="button button-secondary button-compact"
                    onClick={handleResetDemoData}
                    disabled={actionInFlight}
                  >
                    Reset Demo Data
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-compact"
                    onClick={handleSeedDemoData}
                    disabled={actionInFlight}
                  >
                    Seed Demo Data
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="workspace-panel">
            <h3 className="workspace-section-title">Queue guidance</h3>
            <div className="workspace-stack">
              <div className="readonly-box">
                High and critical cases should move from intake to first review
                with minimal delay.
              </div>
              <div className="readonly-box">
                Branch-originated cases need source-unit visibility and clear
                ownership handoff.
              </div>
              <div className="readonly-box">
                Document member statements, staff observations, and intervention
                steps before closure.
              </div>
            </div>
          </div>

          <div className="workspace-panel">
            <h3 className="workspace-section-title">Operator shortcuts</h3>
            <div className="nav-row">
              <Link href="/cases/new">New intake</Link>
              <Link href="/reporting">Reporting</Link>
              <Link href="/pilot">Pilot program</Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="ops-lower-grid">
        <div className="workspace-panel">
          <h3 className="workspace-section-title">Recent activity</h3>
          <div className="timeline-list">
            {selectedCase ? (
              selectedCase.timeline.map((item) => (
                <div className="timeline-item" key={`${item.title}-${item.time}`}>
                  <div className="timeline-item-title">{item.title}</div>
                  <div className="timeline-item-time">{item.time}</div>
                  <div className="muted">{item.body}</div>
                </div>
              ))
            ) : (
              <div className="muted">No recent activity to show.</div>
            )}
          </div>
        </div>

        <div className="workspace-panel">
          <h3 className="workspace-section-title">Source-unit snapshot</h3>
          <div className="reporting-list">
            {sourceSnapshot.map((item) => (
              <div className="reporting-row" key={item.label}>
                <div className="reporting-row-label">{item.label}</div>
                <div className="reporting-row-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
