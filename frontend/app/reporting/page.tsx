"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState } from "react";
import { listScamCases, toQueueCase, type QueueCase as CaseItem } from "../lib/scamCases";

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
    recommendedActions: [],
    timeline: [],
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
    summary: "",
    note: "",
    recommendedActions: [],
    timeline: [],
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
    summary: "",
    note: "",
    recommendedActions: [],
    timeline: [],
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
    summary: "",
    note: "",
    recommendedActions: [],
    timeline: [],
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
    summary: "",
    note: "",
    recommendedActions: [],
    timeline: [],
  },
];

function percent(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function groupCount(cases: CaseItem[], predicate: (item: CaseItem) => boolean) {
  return cases.filter(predicate).length;
}

export default function ReportingPage() {
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        setIsLoading(true);
        const records = await listScamCases();
        const mapped = records.map(toQueueCase);
        setCases(mapped);
        setLoadError("");
      } catch {
        setLoadError("Unable to reach the backend. Showing the built-in demo reporting view.");
        setCases(initialCases);
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadCases();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const totalCases = cases.length;
  const openCases = groupCount(cases, (item) => item.status !== "Closed");
  const closedCases = groupCount(cases, (item) => item.status === "Closed");
  const escalatedCases = groupCount(cases, (item) => item.status === "Escalated");
  const reviewCases = groupCount(cases, (item) => item.status === "Review");
  const newCases = groupCount(cases, (item) => item.status === "New");
  const closureRate = percent(closedCases, totalCases);

  const sourceUnits = [
    {
      label: "Branch network",
      value: groupCount(cases, (item) => item.sourceGroup === "Branch network"),
      color: "blue",
    },
    {
      label: "Contact center",
      value: groupCount(cases, (item) => item.sourceGroup === "Contact center"),
      color: "green",
    },
    {
      label: "Digital banking",
      value: groupCount(cases, (item) => item.sourceGroup === "Digital banking"),
      color: "amber",
    },
  ];

  const riskMix = [
    {
      label: "Critical",
      value: groupCount(cases, (item) => item.risk === "Critical"),
      color: "dark",
    },
    {
      label: "High",
      value: groupCount(cases, (item) => item.risk === "High"),
      color: "red",
    },
    {
      label: "Medium",
      value: groupCount(cases, (item) => item.risk === "Medium"),
      color: "amber",
    },
    {
      label: "Low",
      value: groupCount(cases, (item) => item.risk === "Low"),
      color: "green",
    },
  ];

  const sourceTotal = sourceUnits.reduce((sum, item) => sum + item.value, 0);
  const riskTotal = riskMix.reduce((sum, item) => sum + item.value, 0);

  const fraudOwned = groupCount(cases, (item) =>
    ["Fraud Ops", "Member Protection"].includes(item.owner)
  );
  const branchShare = percent(
    groupCount(cases, (item) => item.sourceGroup === "Branch network"),
    totalCases
  );

  const highestSource = [...sourceUnits].sort((a, b) => b.value - a.value)[0];
  const highestRisk = [...riskMix].sort((a, b) => b.value - a.value)[0];

  const verificationBottleneck = groupCount(cases, (item) =>
    /verify|verification|confirm/i.test(item.nextStep)
  );
  const supervisorBottleneck = groupCount(cases, (item) =>
    /supervisor/i.test(item.nextStep)
  );
  const fraudBottleneck = groupCount(cases, (item) =>
    /fraud/i.test(item.nextStep) || item.owner === "Fraud Ops"
  );
  const documentationBottleneck = groupCount(cases, (item) =>
    /document/i.test(item.nextStep)
  );

  const bottlenecks = [
    { label: "Verification / confirmation", value: verificationBottleneck, color: "blue" },
    { label: "Supervisor review", value: supervisorBottleneck, color: "amber" },
    { label: "Fraud ops handling", value: fraudBottleneck, color: "red" },
    { label: "Documentation follow-up", value: documentationBottleneck, color: "green" },
  ];

  const maxBottleneck = Math.max(...bottlenecks.map((item) => item.value), 1);

  return (
    <main className="page-wrap reporting-page-wrap">
      <section className="page-header">
        <div className="page-kicker">Management reporting</div>
        <h1 className="page-title">Operational reporting</h1>
        <p className="page-subtitle">
          Live reporting driven by the same case data used in intake and the
          operations workspace.
        </p>
      </section>

      <section className="report-toolbar">
        <div className="report-live-pill">{isLoading ? "Loading live backend data" : "Live view · backend case data"}</div>

        <div className="button-row">
          <a href="/ops" className="button button-secondary">
            Back to Workspace
          </a>
          <a href="/cases/new" className="button">
            Start New Intake
          </a>
        </div>
      </section>

      {loadError ? <div className="ops-inline-banner">{loadError}</div> : null}

      <section className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">Total cases</div>
          <div className="kpi-value">{totalCases}</div>
          <div className="kpi-foot">Across the current shared system state</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Open cases</div>
          <div className="kpi-value">{openCases}</div>
          <div className="kpi-foot">New, review, and escalated</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Escalated cases</div>
          <div className="kpi-value">{escalatedCases}</div>
          <div className="kpi-foot">Supervisor or fraud review</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Closure rate</div>
          <div className="kpi-value">{closureRate}%</div>
          <div className="kpi-foot">Closed cases as a share of total</div>
        </div>
      </section>

      <section className="chart-grid">
        <div className="chart-card">
          <h3>Source-unit distribution</h3>
          <p>Where cases are entering the workflow right now.</p>

          <div className="bar-list">
            {sourceUnits.map((item) => {
              const pct = percent(item.value, sourceTotal || 1);
              return (
                <div className="bar-row" key={item.label}>
                  <div className="bar-label-row">
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-value">
                      {item.value} cases · {pct}%
                    </div>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <h3>Risk mix</h3>
          <p>How current cases distribute by assessed urgency.</p>

          <div className="bar-list">
            {riskMix.map((item) => {
              const pct = percent(item.value, riskTotal || 1);
              return (
                <div className="bar-row" key={item.label}>
                  <div className="bar-label-row">
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-value">
                      {item.value} cases · {pct}%
                    </div>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="reporting-grid">
        <div className="progress-card">
          <h3>Workflow progression</h3>
          <p>
            Live workflow state based on current queue status across all cases.
          </p>

          <div className="dual-progress">
            <div className="dual-progress-row">
              <div className="dual-progress-label">
                <span>New</span>
                <span>{percent(newCases, totalCases)}% of total</span>
              </div>
              <div className="stacked-track">
                <div
                  className="stacked-segment stacked-blue"
                  style={{ width: `${percent(newCases, totalCases)}%` }}
                />
              </div>
            </div>

            <div className="dual-progress-row">
              <div className="dual-progress-label">
                <span>Review</span>
                <span>{percent(reviewCases, totalCases)}% of total</span>
              </div>
              <div className="stacked-track">
                <div
                  className="stacked-segment stacked-red"
                  style={{ width: `${percent(reviewCases, totalCases)}%` }}
                />
              </div>
            </div>

            <div className="dual-progress-row">
              <div className="dual-progress-label">
                <span>Closed</span>
                <span>{percent(closedCases, totalCases)}% of total</span>
              </div>
              <div className="stacked-track">
                <div
                  className="stacked-segment stacked-green"
                  style={{ width: `${percent(closedCases, totalCases)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="workspace-panel">
          <h3 className="workspace-section-title">Management outcomes</h3>
          <div className="reporting-list">
            <div className="reporting-row">
              <div className="reporting-row-label">Cases closed</div>
              <div className="reporting-row-value">{closedCases}</div>
            </div>
            <div className="reporting-row">
              <div className="reporting-row-label">Cases currently in review</div>
              <div className="reporting-row-value">{reviewCases}</div>
            </div>
            <div className="reporting-row">
              <div className="reporting-row-label">Fraud / member protection owned</div>
              <div className="reporting-row-value">{fraudOwned}</div>
            </div>
            <div className="reporting-row">
              <div className="reporting-row-label">Branch-originated share</div>
              <div className="reporting-row-value">{branchShare}%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="visual-summary-grid">
        <div className="workspace-panel">
          <h3 className="workspace-section-title">Live highlights</h3>
          <div className="snapshot-list">
            <div className="snapshot-item">
              <div className="snapshot-item-icon">1</div>
              <div className="snapshot-item-text">
                <strong>{highestSource.label} is the largest source</strong>
                <span>
                  It currently represents the biggest share of intake volume in
                  the shared system state.
                </span>
              </div>
            </div>

            <div className="snapshot-item">
              <div className="snapshot-item-icon">2</div>
              <div className="snapshot-item-text">
                <strong>{highestRisk.label} risk cases are materially visible</strong>
                <span>
                  Current risk distribution shows where urgency is concentrating
                  and where triage attention should remain strongest.
                </span>
              </div>
            </div>

            <div className="snapshot-item">
              <div className="snapshot-item-icon">3</div>
              <div className="snapshot-item-text">
                <strong>Reporting is now tied to real product actions</strong>
                <span>
                  New intakes and workspace updates flow into this reporting page
                  through the same backend case source.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="workspace-panel">
          <h3 className="workspace-section-title">Current bottlenecks</h3>
          <div className="bar-list">
            {bottlenecks.map((item) => {
              const pct = percent(item.value, maxBottleneck);
              return (
                <div className="bar-row" key={item.label}>
                  <div className="bar-label-row">
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-value">{item.value}</div>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}