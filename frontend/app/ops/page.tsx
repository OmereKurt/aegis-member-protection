"use client";

import { useEffect, useMemo, useState } from "react";

type TimelineItem = {
  title: string;
  time: string;
  body: string;
};

type CaseItem = {
  id: string;
  title: string;
  source: string;
  sourceGroup: string;
  member: string;
  risk: "Low" | "Medium" | "High" | "Critical";
  status: "New" | "Review" | "Escalated" | "Closed";
  owner: string;
  age: string;
  nextStep: string;
  summary: string;
  note: string;
  recommendedActions: string[];
  timeline: TimelineItem[];
};

const initialCases: CaseItem[] = [
  {
    id: "AGE-2418",
    title: "Member requesting repeated cashier’s checks for new online contact",
    source: "Downtown branch",
    sourceGroup: "Branch network",
    member: "Evelyn R.",
    risk: "High",
    status: "Escalated",
    owner: "Fraud Ops",
    age: "42 min",
    nextStep: "Supervisor callback + transaction hold review",
    summary:
      "Branch staff reported repeated cashier’s check requests tied to a newly introduced online contact. The member appeared uncertain about transaction purpose and deferred to outside instruction.",
    note:
      "Coaching behavior, urgency, and transaction persistence suggest a higher-likelihood exploitation pattern requiring supervisor and fraud coordination.",
    recommendedActions: [
      "Confirm member intent without third-party influence.",
      "Review recent transaction attempts and linked channels.",
      "Escalate to supervisor and fraud operations.",
      "Document staff observations and preserve timeline details.",
    ],
    timeline: [
      {
        title: "Case escalated from branch to fraud operations",
        time: "2:18 PM",
        body: "Branch staff documented coaching behavior by accompanying individual and requested elevated review.",
      },
      {
        title: "Member outreach queued",
        time: "2:07 PM",
        body: "Outbound verification requested before release of additional transaction activity.",
      },
      {
        title: "Urgency score updated to high",
        time: "1:56 PM",
        body: "Narrative and transaction pattern triggered elevated handling threshold.",
      },
      {
        title: "Transaction hold review requested",
        time: "1:41 PM",
        body: "Team requested verification before additional cashier’s check activity proceeds.",
      },
    ],
  },
  {
    id: "AGE-2417",
    title: "Wire transfer pressure after repeated grandchild emergency calls",
    source: "Contact center",
    sourceGroup: "Contact center",
    member: "Harold T.",
    risk: "Critical",
    status: "Review",
    owner: "Member Protection",
    age: "19 min",
    nextStep: "Outbound verification and case note completion",
    summary:
      "Member described repeated emergency calls requesting urgent wire transfers for a supposed family crisis. Contact center staff identified pressure tactics and inconsistent story details.",
    note:
      "The emotional urgency and repeated contact pattern suggest elevated scam risk and require rapid documented follow-up.",
    recommendedActions: [
      "Pause wire activity pending direct verification.",
      "Call back using existing member contact details.",
      "Document pressure language and stated beneficiary details.",
      "Coordinate with fraud or supervisor review if urgency persists.",
    ],
    timeline: [
      {
        title: "Case routed for member protection review",
        time: "2:26 PM",
        body: "Contact center team elevated after repeated emergency-transfer language.",
      },
      {
        title: "Outbound verification requested",
        time: "2:13 PM",
        body: "Agent recommended callback using known contact details before any release.",
      },
      {
        title: "Case opened from contact center interaction",
        time: "1:58 PM",
        body: "Initial case created after member referenced urgent wire instructions tied to family distress.",
      },
    ],
  },
  {
    id: "AGE-2415",
    title: "Companion attempting to direct withdrawal and override member responses",
    source: "North branch",
    sourceGroup: "Branch network",
    member: "Miriam S.",
    risk: "High",
    status: "New",
    owner: "Queue",
    age: "1 hr",
    nextStep: "Branch manager review",
    summary:
      "Branch staff observed a companion answering questions for the member and attempting to direct a large withdrawal. The member appeared hesitant and deferred repeatedly.",
    note:
      "Observed third-party control behavior indicates a possible exploitation pattern and should be documented before funds leave the account.",
    recommendedActions: [
      "Separate member from companion if possible during questioning.",
      "Document exact staff observations in the case record.",
      "Escalate for branch manager or fraud review.",
      "Assess whether additional transactions should be delayed.",
    ],
    timeline: [
      {
        title: "Case created by branch staff",
        time: "1:44 PM",
        body: "Staff escalated concern after repeated third-party interference during withdrawal discussion.",
      },
      {
        title: "Manager review requested",
        time: "1:37 PM",
        body: "Branch team flagged the case for supervisory support.",
      },
    ],
  },
  {
    id: "AGE-2412",
    title: "Unusual ACH activity following recent device and contact detail changes",
    source: "Digital banking",
    sourceGroup: "Digital banking",
    member: "James W.",
    risk: "Medium",
    status: "Review",
    owner: "Fraud Ops",
    age: "2 hrs",
    nextStep: "Confirm recent profile changes with member",
    summary:
      "Recent profile updates were followed by unusual ACH activity. The pattern is not conclusive on its own, but the change sequence warrants a structured review.",
    note:
      "This case may reflect account takeover or coached activity and should stay in monitored review until member verification is complete.",
    recommendedActions: [
      "Confirm recent device and contact changes with the member.",
      "Review timing of ACH initiation against profile modifications.",
      "Document any recent outreach or self-service anomalies.",
      "Escalate if verification fails or member expresses uncertainty.",
    ],
    timeline: [
      {
        title: "Fraud operations opened structured review",
        time: "12:56 PM",
        body: "Device and contact detail changes preceded unusual ACH behavior.",
      },
      {
        title: "ACH activity linked to profile changes",
        time: "12:31 PM",
        body: "System review flagged timing overlap between updates and transaction activity.",
      },
    ],
  },
  {
    id: "AGE-2408",
    title: "Teller concern after repeated high-value withdrawals with inconsistent purpose",
    source: "West branch",
    sourceGroup: "Branch network",
    member: "Sharon K.",
    risk: "High",
    status: "Closed",
    owner: "Branch Ops",
    age: "Today",
    nextStep: "Closed with documentation",
    summary:
      "A teller documented repeated high-value withdrawals over multiple visits. Follow-up conversations led to a closed case with completed notes and outcome tracking.",
    note:
      "The case is closed, but it remains useful as an example of documented intervention and branch-originated visibility.",
    recommendedActions: [
      "Retain completed documentation and timeline history.",
      "Review whether branch coaching or awareness follow-up is needed.",
      "Use as a reference pattern for similar future cases.",
    ],
    timeline: [
      {
        title: "Case closed with final documentation",
        time: "11:42 AM",
        body: "Branch team completed notes and closure summary after follow-up review.",
      },
      {
        title: "Final member verification completed",
        time: "10:55 AM",
        body: "Staff documented the final conversation and outcome before closure.",
      },
    ],
  },
];

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

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function percent(count: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

export default function OperationsPage() {
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCases[0].id);

  const [sourceFilter, setSourceFilter] = useState("All source units");
  const [riskFilter, setRiskFilter] = useState("All risk levels");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [teamFilter, setTeamFilter] = useState("All teams");

  const [actionFeedback, setActionFeedback] = useState("");

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
    if (!filteredQueue.some((item) => item.id === selectedCaseId)) {
      if (filteredQueue.length > 0) {
        setSelectedCaseId(filteredQueue[0].id);
      }
    }
  }, [filteredQueue, selectedCaseId]);

  const selectedCase =
    filteredQueue.find((item) => item.id === selectedCaseId) ??
    cases.find((item) => item.id === selectedCaseId) ??
    cases[0];

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

  function updateSelectedCase(
    updater: (existing: CaseItem) => CaseItem,
    feedback: string
  ) {
    setCases((prev) =>
      prev.map((item) =>
        item.id === selectedCase.id ? updater(item) : item
      )
    );
    setActionFeedback(feedback);
  }

  function addTimeline(existing: CaseItem, title: string, body: string) {
    return [
      { title, body, time: nowLabel() },
      ...existing.timeline,
    ].slice(0, 6);
  }

  function handleEscalate() {
    updateSelectedCase(
      (item) => ({
        ...item,
        status: "Escalated",
        owner: item.owner === "Queue" ? "Fraud Ops" : item.owner,
        nextStep: "Supervisor and fraud review underway",
        timeline: addTimeline(
          item,
          "Case escalated by operator",
          "Selected case was moved into escalated handling from the focused workspace."
        ),
      }),
      `Escalation recorded for ${selectedCase.id}.`
    );
  }

  function handleAssignFraudOps() {
    updateSelectedCase(
      (item) => ({
        ...item,
        owner: "Fraud Ops",
        nextStep: "Fraud Ops owner reviewing case",
        timeline: addTimeline(
          item,
          "Case assigned to Fraud Ops",
          "Focused case ownership was updated from the workspace action panel."
        ),
      }),
      `Owner updated to Fraud Ops for ${selectedCase.id}.`
    );
  }

  function handleAddNote() {
    updateSelectedCase(
      (item) => ({
        ...item,
        timeline: addTimeline(
          item,
          "Operator note added",
          "Additional operator context was recorded from the focused case panel."
        ),
      }),
      `Operator note added to ${selectedCase.id}.`
    );
  }

  function handleMarkReviewed() {
    updateSelectedCase(
      (item) => ({
        ...item,
        status: item.status === "Closed" ? "Closed" : "Review",
        nextStep:
          item.status === "Closed"
            ? item.nextStep
            : "Awaiting documented follow-up and next action",
        timeline: addTimeline(
          item,
          "Case marked as reviewed",
          "Focused case status was updated to reviewed from the workspace panel."
        ),
      }),
      `Review status updated for ${selectedCase.id}.`
    );
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
                <a href="/cases/new" className="button">
                  Start New Intake
                </a>
                <a href="/reporting" className="button button-secondary">
                  Open Reporting
                </a>
              </div>
            </div>

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
                        No cases match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => (
                      <tr
                        key={item.id}
                        className={item.id === selectedCase.id ? "is-selected" : ""}
                        onClick={() => {
                          setSelectedCaseId(item.id);
                          setActionFeedback("");
                        }}
                      >
                        <td>
                          <div className="queue-title">
                            <strong>{item.title}</strong>
                            <span className="queue-subtext">
                              {item.id} · {item.member}
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
          <div className="workspace-hero sticky-case-panel">
            <div className="workspace-title-row">
              <div className="workspace-title-block">
                <h2>Focused case view</h2>
                <p className="workspace-subtle">
                  Live case details driven by the selected queue row.
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
                <div className="value">{selectedCase.id}</div>
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
                <div className="label">Next step</div>
                <div className="value">{selectedCase.nextStep}</div>
              </div>
            </div>

            <div className="action-grid">
              <button type="button" className="button button-compact" onClick={handleEscalate}>
                Escalate case
              </button>
              <button
                type="button"
                className="button button-secondary button-compact"
                onClick={handleAssignFraudOps}
              >
                Assign to Fraud Ops
              </button>
              <button
                type="button"
                className="button button-secondary button-compact"
                onClick={handleAddNote}
              >
                Add operator note
              </button>
              <button
                type="button"
                className="button button-secondary button-compact"
                onClick={handleMarkReviewed}
              >
                Mark reviewed
              </button>
            </div>

            {actionFeedback ? (
              <div className="action-feedback">{actionFeedback}</div>
            ) : null}

            <div className="focused-case-stack">
              <div>
                <h3 className="workspace-section-title">Case summary</h3>
                <p className="workspace-subtle">{selectedCase.summary}</p>
              </div>

              <div className="workspace-callout">
                <strong>Operator note:</strong> {selectedCase.note}
              </div>

              <div>
                <h3 className="workspace-section-title">Recommended actions</h3>
                <ul className="workspace-list">
                  {selectedCase.recommendedActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
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
              <a href="/cases/new">New intake</a>
              <a href="/reporting">Reporting</a>
              <a href="/pilot">Pilot program</a>
            </div>
          </div>
        </aside>
      </section>

      <section className="ops-lower-grid">
        <div className="workspace-panel">
          <h3 className="workspace-section-title">Recent activity</h3>
          <div className="timeline-list">
            {selectedCase.timeline.map((item) => (
              <div className="timeline-item" key={`${item.title}-${item.time}`}>
                <div className="timeline-item-title">{item.title}</div>
                <div className="timeline-item-time">{item.time}</div>
                <div className="muted">{item.body}</div>
              </div>
            ))}
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