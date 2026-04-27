"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listCases, type BackendCase } from "./lib/cases";

const workflowSteps = [
  "Intake",
  "Intelligence",
  "Guided Intervention",
  "Closure",
  "Reporting",
];

const differentiators = [
  {
    title: "Explainable case intelligence",
    body: "Transforms intake signals into likely pattern, risk drivers, missing information, and suggested escalation path.",
  },
  {
    title: "Guided intervention playbook",
    body: "Gives operators a structured sequence for member intent, funds status, callback, escalation, and closure readiness.",
  },
  {
    title: "Structured closure outcomes",
    body: "Captures outcome type, protected/lost amounts, follow-up flags, trusted contact engagement, and fraud ops involvement.",
  },
  {
    title: "Management reporting",
    body: "Turns live case data into operational visibility across source units, risk concentration, outcomes, and workflow bottlenecks.",
  },
];

const teamGroups = [
  "Branch operations",
  "Contact center",
  "Fraud operations",
  "Member protection leaders",
];

const playbookStepLabels = [
  "Verify member intent",
  "Confirm transaction / funds status",
  "Attempt safe member callback",
  "Consider trusted contact",
  "Escalate to supervisor or fraud ops",
  "Record intervention result",
  "Close case with outcome",
];

function currency(value: number) {
  return value.toLocaleString([], {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function isElevatedRisk(record: BackendCase) {
  return record.urgency === "High" || record.urgency === "Critical";
}

function hasPlaybookCompleted(record: BackendCase, label: string) {
  const text = record.action_logs
    .map((log) => `${log.action_type} ${log.details}`)
    .join("\n")
    .toLowerCase();
  return text.includes(`playbook step completed: ${label.toLowerCase()}`);
}

function percent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export default function HomePage() {
  const [cases, setCases] = useState<BackendCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadSnapshot() {
      try {
        setIsLoading(true);
        const records = await listCases();
        setCases(records);
        setLoadError("");
      } catch {
        setCases([]);
        setLoadError("Sign in to view live case posture.");
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadSnapshot();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const snapshot = useMemo(() => {
    const totalCases = cases.length;
    const openCases = cases.filter((item) => item.status !== "Closed").length;
    const elevatedRiskCases = cases.filter(isElevatedRisk).length;
    const casesWithPlaybookProgress = cases.filter((item) =>
      playbookStepLabels.some((label) => hasPlaybookCompleted(item, label))
    ).length;
    const protectedAmount = cases.reduce(
      (sum, item) => sum + Number(item.estimated_amount_protected || 0),
      0
    );

    return {
      totalCases,
      openCases,
      elevatedRiskCases,
      playbookProgress: percent(casesWithPlaybookProgress, totalCases),
      protectedAmount,
    };
  }, [cases]);

  return (
    <main className="page-wrap home-console-page workspace-shell">
      <section className="home-console-hero console-panel">
        <div className="home-hero-main">
          <div className="page-kicker">Aegis Member Protection</div>
          <h1>A workflow system for suspected elder financial exploitation cases.</h1>
          <p>
            Aegis helps credit unions and regional banks intake concerns, assess
            risk, guide interventions, document actions, close outcomes, and
            report on member protection workflows.
          </p>

          <div className="home-action-row">
            <Link href="/ops" className="button">
              Open Operations
            </Link>
            <Link href="/cases/new" className="button button-secondary">
              Start Intake
            </Link>
            <Link href="/reporting" className="button button-secondary">
              View Reporting
            </Link>
          </div>
        </div>

        <aside className="home-snapshot inspector-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">System snapshot</div>
              <h2>Live case posture</h2>
            </div>
            <span className="report-live-pill">
              {isLoading ? "Loading" : loadError ? "Unavailable" : "Live"}
            </span>
          </div>

          {loadError ? (
            <div className="readonly-box">
              <strong>Live snapshot requires sign-in</strong>
              <p>{loadError}</p>
            </div>
          ) : (
            <div className="home-snapshot-grid">
              <Metric label="Open cases" value={isLoading ? "..." : snapshot.openCases} />
              <Metric label="Elevated risk" value={isLoading ? "..." : snapshot.elevatedRiskCases} />
              <Metric label="Playbook progress" value={isLoading ? "..." : `${snapshot.playbookProgress}%`} />
              <Metric label="Protected amount" value={isLoading ? "..." : currency(snapshot.protectedAmount)} />
            </div>
          )}

          {!isLoading && !loadError && snapshot.totalCases === 0 ? (
            <div className="home-empty-note">
              Snapshot metrics will populate as intakes are submitted or demo data is seeded from Operations.
            </div>
          ) : null}
        </aside>
      </section>

      <section className="home-workflow-panel console-panel">
        <div className="home-panel-header">
          <div>
            <div className="page-kicker">Operating model</div>
            <h2>From first concern to management visibility</h2>
          </div>
        </div>
        <div className="home-workflow-row">
          {workflowSteps.map((step, index) => (
            <div className="home-workflow-step" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="home-console-grid">
        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Product differentiators</div>
              <h2>Purpose-built case operations</h2>
            </div>
          </div>
          <div className="home-differentiator-list">
            {differentiators.map((item) => (
              <div className="home-differentiator-row" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Built for teams</div>
              <h2>One workflow across operating groups</h2>
            </div>
          </div>
          <div className="home-team-list">
            {teamGroups.map((team) => (
              <div className="home-team-row" key={team}>
                <span />
                <strong>{team}</strong>
              </div>
            ))}
          </div>
          <p className="home-team-note">
            Aegis keeps branch observations, contact center signals, fraud review,
            and leadership reporting connected to the same backend-backed case
            record.
          </p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-pill analytics-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
