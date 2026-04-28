"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listCases, type BackendCase } from "./lib/cases";

const workflowSteps = [
  "Intake",
  "Triage",
  "Investigation",
  "Intervention",
  "Closure",
  "Reporting",
];

const platformCapabilities = [
  {
    kicker: "Frontline intake",
    title: "Structured intake for frontline staff.",
    body: "Capture member context, transaction exposure, and risk signals without leaving the workflow.",
    points: ["Live triage preview", "Draft save", "Submit to queue"],
  },
  {
    kicker: "Operations workbench",
    title: "A focused surface for investigators.",
    body: "Work the queue, open a full case, log actions, and keep playbook, notes, Assist drafts, and closure connected.",
    points: ["Queue + inspector", "Guided playbook", "Action history"],
  },
  {
    kicker: "Management visibility",
    title: "Reporting for oversight.",
    body: "Track workload, source patterns, intervention progress, protected/lost amounts, and follow-up needs from live case data.",
    points: ["Outcome tracking", "Risk distribution", "Management brief"],
  },
];

const enterpriseControls = [
  "Auth + RBAC",
  "CSRF protection",
  "Security headers",
  "Rate limiting",
  "Input validation",
  "Audit logging",
  "SQLite/Postgres",
  "Dockerized deployment",
];

const reviewerPath = [
  "Sign in",
  "Intake",
  "Operations",
  "Case Workspace",
  "Reporting",
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

  const topCase = cases[0];

  return (
    <main className="page-wrap home-console-page home-product-page workspace-shell">
      <section className="home-product-hero">
        <div className="home-product-hero-copy">
          <div className="page-kicker">Aegis Member Protection</div>
          <h1>Case operations for suspected elder financial exploitation.</h1>
          <p>
            Aegis gives credit unions and regional banks a secure workflow to
            intake concerns, triage risk, guide interventions, close outcomes,
            and report on member protection operations.
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

          <div className="home-trust-line">
            Built as a full-stack security engineering portfolio project with auth, RBAC, audit logging, Docker, Postgres support, and assistive AI drafts.
          </div>
        </div>

        <aside className="home-product-preview" aria-label="Aegis product preview">
          <div className="preview-window-bar">
            <span />
            <strong>Operations console</strong>
            <em>{isLoading ? "Loading" : loadError ? "Demo preview" : "Live data"}</em>
          </div>

          <div className="preview-command-strip">
            <div>
              <span>Open cases</span>
              <strong>{isLoading || loadError ? "..." : snapshot.openCases}</strong>
            </div>
            <div>
              <span>Elevated risk</span>
              <strong>{isLoading || loadError ? "..." : snapshot.elevatedRiskCases}</strong>
            </div>
            <div>
              <span>Protected</span>
              <strong>{isLoading || loadError ? "..." : currency(snapshot.protectedAmount)}</strong>
            </div>
          </div>

          <div className="preview-case-panel">
            <div className="preview-case-main">
              <div className="page-kicker">Focused case</div>
              <h2>{topCase?.title || "Member protection case workspace"}</h2>
              <p>
                {topCase?.summary ||
                  "Risk signals, member context, playbook state, closure workflow, and operator history are presented in one investigation surface."}
              </p>
            </div>
            <div className="preview-risk-stack">
              <span className="badge badge-medium">{topCase?.urgency || "Risk"}</span>
              <span className="badge badge-status-review">{topCase?.status || "Status"}</span>
            </div>
          </div>

          <div className="preview-grid">
            <div>
              <span>Likely pattern</span>
              <strong>{topCase?.case_intelligence?.likely_pattern || "Available after sign-in"}</strong>
            </div>
            <div>
              <span>Guided next step</span>
              <strong>{topCase ? "Verify member intent" : "Shown from case state"}</strong>
            </div>
            <div>
              <span>Playbook progress</span>
              <strong>{isLoading || loadError ? "..." : `${snapshot.playbookProgress}%`}</strong>
            </div>
            <div>
              <span>Source unit</span>
              <strong>{topCase?.source_unit || "Live source unit"}</strong>
            </div>
          </div>

          <div className="preview-assist-panel">
            <span>Aegis Assist</span>
            <strong>Draft summary · operator note · management brief</strong>
          </div>
        </aside>
      </section>

      <section className="home-simple-workflow">
        <div className="home-section-copy">
          <div className="page-kicker">Operating model</div>
          <h2>One workflow from first concern to reporting.</h2>
        </div>

        <div className="home-simple-flow">
          {workflowSteps.map((step, index) => (
            <div className="home-simple-step" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="home-simple-capabilities">
        {platformCapabilities.map((item, index) => (
          <article
            className={`home-simple-capability ${index % 2 === 1 ? "is-reversed" : ""}`}
            key={item.title}
          >
            <div className="home-section-copy">
              <div className="page-kicker">{item.kicker}</div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <div className="home-chip-row">
                {item.points.map((point) => (
                  <span key={point}>{point}</span>
                ))}
              </div>
            </div>

            <div className="home-simple-visual" aria-hidden="true">
              <div className="home-simple-visual-header">
                <span>{item.kicker}</span>
                <strong>{index === 0 ? "Intake" : index === 1 ? "Case work" : "Oversight"}</strong>
              </div>
              {item.points.map((point, pointIndex) => (
                <div className="home-simple-visual-row" key={point}>
                  <span>{pointIndex + 1}</span>
                  <strong>{point}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="home-simple-foundation">
        <div className="home-section-copy">
          <div className="page-kicker">Enterprise-ready foundation</div>
          <h2>Security and deployment controls reviewers can inspect.</h2>
        </div>

        <div className="home-foundation-strip">
          {enterpriseControls.map((control) => (
            <span key={control}>{control}</span>
          ))}
        </div>
      </section>

      <section className="home-simple-cta">
        <div className="home-section-copy">
          <div className="page-kicker">Explore the demo</div>
          <h2>A short path through the product.</h2>
        </div>

        <div className="home-demo-path">
          {reviewerPath.map((item, index) => (
            <span key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </span>
          ))}
        </div>

        <div className="home-action-row">
          <Link href="/cases/new" className="button">
            Start Intake
          </Link>
          <Link href="/ops" className="button button-secondary">
            Open Operations
          </Link>
          <Link href="/pilot" className="button button-secondary">
            View Pilot Page
          </Link>
        </div>
      </section>
    </main>
  );
}
