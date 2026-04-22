"use client";

import { useMemo, useState } from "react";

type PeriodKey = "7d" | "30d" | "90d";

const reportingData = {
  "7d": {
    label: "Last 7 days",
    totalCases: 42,
    escalated: 11,
    medianTriage: "13m",
    closureRate: "71%",
    sourceUnits: [
      { label: "Branch network", value: 22, color: "blue" },
      { label: "Contact center", value: 13, color: "green" },
      { label: "Digital / self-service", value: 7, color: "amber" },
    ],
    riskMix: [
      { label: "Critical", value: 6, color: "dark" },
      { label: "High", value: 15, color: "red" },
      { label: "Medium", value: 14, color: "amber" },
      { label: "Low", value: 7, color: "green" },
    ],
    workflow: {
      intake: 42,
      review: 23,
      escalated: 11,
      closed: 30,
    },
    outcomes: [
      { label: "Cases closed with intervention documented", value: "30" },
      { label: "Cases requiring fraud or supervisor escalation", value: "11" },
      { label: "Cases originating from branches", value: "52%" },
      { label: "Median first-review time", value: "13m" },
    ],
    highlights: [
      {
        title: "Branch activity remains the largest source",
        body: "Most case volume is still beginning at the branch level, which reinforces the need for strong source-unit visibility and structured handoff.",
      },
      {
        title: "High-risk cases are moving faster",
        body: "Median triage time remains low for escalated cases, which suggests the workflow is supporting earlier operator action.",
      },
      {
        title: "Contact center volume is material",
        body: "Contact center intake continues to represent a meaningful share of suspicious-case initiation and should stay visible in reporting.",
      },
    ],
    bottlenecks: [
      { label: "Waiting on member verification", value: 9 },
      { label: "Supervisor review pending", value: 6 },
      { label: "Fraud ops ownership transition", value: 4 },
      { label: "Documentation completion", value: 3 },
    ],
  },
  "30d": {
    label: "Last 30 days",
    totalCases: 168,
    escalated: 39,
    medianTriage: "15m",
    closureRate: "74%",
    sourceUnits: [
      { label: "Branch network", value: 87, color: "blue" },
      { label: "Contact center", value: 51, color: "green" },
      { label: "Digital / self-service", value: 30, color: "amber" },
    ],
    riskMix: [
      { label: "Critical", value: 18, color: "dark" },
      { label: "High", value: 57, color: "red" },
      { label: "Medium", value: 61, color: "amber" },
      { label: "Low", value: 32, color: "green" },
    ],
    workflow: {
      intake: 168,
      review: 96,
      escalated: 39,
      closed: 124,
    },
    outcomes: [
      { label: "Cases closed with intervention documented", value: "124" },
      { label: "Cases requiring fraud or supervisor escalation", value: "39" },
      { label: "Cases originating from branches", value: "52%" },
      { label: "Median first-review time", value: "15m" },
    ],
    highlights: [
      {
        title: "Branch and contact center remain the primary feeders",
        body: "Together they drive the majority of case volume, which makes cross-team workflow consistency a core reporting need.",
      },
      {
        title: "Escalation volume is concentrated in high-risk cases",
        body: "The workflow is surfacing which cases require supervisor or fraud handling without forcing everything into one queue.",
      },
      {
        title: "Closure rate is strong, but review-stage capacity matters",
        body: "The review bucket remains the place where case timing can slip if ownership is not clearly maintained.",
      },
    ],
    bottlenecks: [
      { label: "Waiting on member verification", value: 28 },
      { label: "Supervisor review pending", value: 17 },
      { label: "Fraud ops ownership transition", value: 12 },
      { label: "Documentation completion", value: 9 },
    ],
  },
  "90d": {
    label: "Last 90 days",
    totalCases: 472,
    escalated: 108,
    medianTriage: "17m",
    closureRate: "76%",
    sourceUnits: [
      { label: "Branch network", value: 241, color: "blue" },
      { label: "Contact center", value: 146, color: "green" },
      { label: "Digital / self-service", value: 85, color: "amber" },
    ],
    riskMix: [
      { label: "Critical", value: 46, color: "dark" },
      { label: "High", value: 161, color: "red" },
      { label: "Medium", value: 173, color: "amber" },
      { label: "Low", value: 92, color: "green" },
    ],
    workflow: {
      intake: 472,
      review: 258,
      escalated: 108,
      closed: 359,
    },
    outcomes: [
      { label: "Cases closed with intervention documented", value: "359" },
      { label: "Cases requiring fraud or supervisor escalation", value: "108" },
      { label: "Cases originating from branches", value: "51%" },
      { label: "Median first-review time", value: "17m" },
    ],
    highlights: [
      {
        title: "The workflow is creating consistent source-unit visibility",
        body: "Management can see where cases begin, where they escalate, and how outcomes distribute across the operating model.",
      },
      {
        title: "High and critical cases remain a substantial share",
        body: "This supports the need for a dedicated case-handling workflow rather than generic case notes or fragmented spreadsheets.",
      },
      {
        title: "Operational reporting is exposing review-stage friction",
        body: "The most important management value is not only the totals, but where the queue slows and where interventions cluster.",
      },
    ],
    bottlenecks: [
      { label: "Waiting on member verification", value: 76 },
      { label: "Supervisor review pending", value: 41 },
      { label: "Fraud ops ownership transition", value: 28 },
      { label: "Documentation completion", value: 19 },
    ],
  },
} as const;

function sum(items: Array<{ value: number }>) {
  return items.reduce((acc, item) => acc + item.value, 0);
}

export default function ReportingPage() {
  const [period, setPeriod] = useState<PeriodKey>("30d");

  const data = reportingData[period];

  const totalSource = useMemo(() => sum(data.sourceUnits), [data]);
  const totalRisk = useMemo(() => sum(data.riskMix), [data]);

  const reviewPct = Math.round((data.workflow.review / data.workflow.intake) * 100);
  const escalatedPct = Math.round(
    (data.workflow.escalated / data.workflow.intake) * 100
  );
  const closedPct = Math.round((data.workflow.closed / data.workflow.intake) * 100);

  return (
    <main className="page-wrap reporting-page-wrap">
      <section className="page-header">
        <div className="page-kicker">Management reporting</div>
        <h1 className="page-title">Operational reporting</h1>
        <p className="page-subtitle">
          Review case volume, source-unit distribution, workflow progression,
          and member protection outcomes across the operating model.
        </p>
      </section>

      <section className="report-toolbar">
        <div className="report-periods">
          <button
            type="button"
            className={period === "7d" ? "report-pill is-active" : "report-pill"}
            onClick={() => setPeriod("7d")}
          >
            Last 7 days
          </button>
          <button
            type="button"
            className={period === "30d" ? "report-pill is-active" : "report-pill"}
            onClick={() => setPeriod("30d")}
          >
            Last 30 days
          </button>
          <button
            type="button"
            className={period === "90d" ? "report-pill is-active" : "report-pill"}
            onClick={() => setPeriod("90d")}
          >
            Last 90 days
          </button>
        </div>

        <div className="button-row">
          <a href="/ops" className="button button-secondary">
            Back to Workspace
          </a>
          <a href="/cases/new" className="button">
            Start New Intake
          </a>
        </div>
      </section>

      <section className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">Case volume</div>
          <div className="kpi-value">{data.totalCases}</div>
          <div className="kpi-foot">{data.label}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Escalated cases</div>
          <div className="kpi-value">{data.escalated}</div>
          <div className="kpi-foot">Supervisor or fraud review</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Median triage time</div>
          <div className="kpi-value">{data.medianTriage}</div>
          <div className="kpi-foot">From intake to first review</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Closure rate</div>
          <div className="kpi-value">{data.closureRate}</div>
          <div className="kpi-foot">Documented closure completion</div>
        </div>
      </section>

      <section className="chart-grid">
        <div className="chart-card">
          <h3>Source-unit distribution</h3>
          <p>Where suspected exploitation cases are entering the workflow.</p>

          <div className="bar-list">
            {data.sourceUnits.map((item) => {
              const pct = Math.round((item.value / totalSource) * 100);
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
          <p>Distribution of cases by current assessed risk level.</p>

          <div className="bar-list">
            {data.riskMix.map((item) => {
              const pct = Math.round((item.value / totalRisk) * 100);
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
            This view shows how cases are moving through intake, review,
            escalation, and closure.
          </p>

          <div className="dual-progress">
            <div className="dual-progress-row">
              <div className="dual-progress-label">
                <span>Review stage</span>
                <span>{reviewPct}% of intake</span>
              </div>
              <div className="stacked-track">
                <div
                  className="stacked-segment stacked-blue"
                  style={{ width: `${reviewPct}%` }}
                />
              </div>
            </div>

            <div className="dual-progress-row">
              <div className="dual-progress-label">
                <span>Escalated</span>
                <span>{escalatedPct}% of intake</span>
              </div>
              <div className="stacked-track">
                <div
                  className="stacked-segment stacked-red"
                  style={{ width: `${escalatedPct}%` }}
                />
              </div>
            </div>

            <div className="dual-progress-row">
              <div className="dual-progress-label">
                <span>Closed</span>
                <span>{closedPct}% of intake</span>
              </div>
              <div className="stacked-track">
                <div
                  className="stacked-segment stacked-green"
                  style={{ width: `${closedPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="workspace-panel">
          <h3 className="workspace-section-title">Management outcomes</h3>
          <div className="reporting-list">
            {data.outcomes.map((item) => (
              <div className="reporting-row" key={item.label}>
                <div className="reporting-row-label">{item.label}</div>
                <div className="reporting-row-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="visual-summary-grid">
        <div className="workspace-panel">
          <h3 className="workspace-section-title">Management highlights</h3>
          <div className="snapshot-list">
            {data.highlights.map((item, index) => (
              <div className="snapshot-item" key={item.title}>
                <div className="snapshot-item-icon">{index + 1}</div>
                <div className="snapshot-item-text">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="workspace-panel">
          <h3 className="workspace-section-title">Current bottlenecks</h3>
          <div className="bar-list">
            {data.bottlenecks.map((item, index) => {
              const max = Math.max(...data.bottlenecks.map((b) => b.value));
              const pct = Math.round((item.value / max) * 100);

              const color =
                index === 0
                  ? "red"
                  : index === 1
                  ? "amber"
                  : index === 2
                  ? "blue"
                  : "green";

              return (
                <div className="bar-row" key={item.label}>
                  <div className="bar-label-row">
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-value">{item.value}</div>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${color}`}
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