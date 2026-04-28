"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthProvider";
import { generateManagementBriefDraft, type AssistResponse } from "../lib/assist";
import {
  listCases,
  outcomeLabel,
  outcomeOptions,
  type BackendCase,
} from "../lib/cases";

const playbookStepLabels = [
  "Verify member intent",
  "Confirm transaction / funds status",
  "Attempt safe member callback",
  "Consider trusted contact",
  "Escalate to supervisor or fraud ops",
  "Record intervention result",
  "Close case with outcome",
];

function percent(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function currency(value: number) {
  return value.toLocaleString([], {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function riskRank(value: string) {
  return value === "Critical" || value === "High";
}

function sourceGroup(record: BackendCase) {
  const source = `${record.source_unit} ${record.intake_channel || ""}`.toLowerCase();
  if (source.includes("branch")) return "Branch network";
  if (source.includes("contact") || source.includes("call") || source.includes("phone")) return "Contact center";
  if (source.includes("digital") || source.includes("online")) return "Digital banking";
  return record.source_unit || "Other";
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function sortedRows(counts: Record<string, number>) {
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function displayPattern(value?: string | null) {
  if (!value) return "Unknown / other";
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function logText(record: BackendCase) {
  return record.action_logs.map((log) => `${log.action_type} ${log.details}`.toLowerCase()).join("\n");
}

function hasPlaybookCompleted(record: BackendCase, label: string) {
  const text = logText(record);
  return text.includes(`playbook step completed: ${label.toLowerCase()}`);
}

function hasPlaybookSkipped(record: BackendCase, label: string) {
  const text = logText(record);
  return text.includes(`playbook step skipped: ${label.toLowerCase()}`);
}

function hasInterventionResult(record: BackendCase) {
  const text = logText(record);
  return (
    text.includes("record intervention result") ||
    text.includes("mark_intervention_complete") ||
    text.includes("playbook step completed: record intervention result")
  );
}

function barColor(index: number) {
  return ["blue", "green", "amber", "red", "dark"][index % 5];
}

function maxValue(rows: { value: number }[]) {
  return Math.max(...rows.map((item) => item.value), 1);
}

const chartPalette = ["#146c7c", "#067647", "#a15c07", "#b42318", "#344054", "#667085"];

function compositionBackground(rows: { value: number }[]) {
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  if (!total) return "#e5ebf1";

  let cursor = 0;
  const segments = rows.map((item, index) => {
    const start = cursor;
    const size = (item.value / total) * 100;
    cursor += size;
    return `${chartPalette[index % chartPalette.length]} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

export default function ReportingPage() {
  const auth = useAuth();
  const [cases, setCases] = useState<BackendCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [briefDraft, setBriefDraft] = useState<AssistResponse | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState("");

  useEffect(() => {
    async function loadReportingCases() {
      try {
        setIsLoading(true);
        const records = await listCases();
        setCases(records);
        setLoadError("");
      } catch {
        setCases([]);
        setLoadError("System connection issue. Reporting will populate when live case data is available.");
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadReportingCases();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const analytics = useMemo(() => {
    const totalCases = cases.length;
    const openCases = cases.filter((item) => item.status !== "Closed").length;
    const closedCases = cases.filter((item) => item.status === "Closed").length;
    const escalatedCases = cases.filter((item) => item.status === "Escalated").length;
    const highCriticalCases = cases.filter((item) => riskRank(item.urgency)).length;
    const followUpRequired = cases.filter((item) => item.follow_up_required).length;
    const protectedAmount = cases.reduce((sum, item) => sum + Number(item.estimated_amount_protected || 0), 0);
    const lostAmount = cases.reduce((sum, item) => sum + Number(item.estimated_amount_lost || 0), 0);
    const trustedContactEngaged = cases.filter((item) => item.trusted_contact_engaged).length;
    const fraudOpsInvolved = cases.filter((item) => item.fraud_ops_involved).length;

    const patternRows = sortedRows(
      countBy(cases, (item) => item.case_intelligence?.likely_pattern || displayPattern(item.scam_type))
    );
    const sourceRows = sortedRows(countBy(cases, sourceGroup));
    const riskRows = sortedRows(countBy(cases, (item) => item.urgency));
    const sourceRiskRows = sortedRows(
      cases
        .filter((item) => riskRank(item.urgency))
        .reduce<Record<string, number>>((acc, item) => {
          const key = sourceGroup(item);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {})
    );

    const outcomeRows = outcomeOptions
      .map((option) => ({
        label: option.label,
        value: cases.filter((item) => item.outcome_type === option.value).length,
      }))
      .filter((item) => item.value > 0);

    const completedStepRows = playbookStepLabels
      .map((label) => ({
        label,
        value: cases.filter((item) => hasPlaybookCompleted(item, label)).length,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const skippedStepRows = playbookStepLabels
      .map((label) => ({
        label,
        value: cases.filter((item) => hasPlaybookSkipped(item, label)).length,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const casesWithCompletedPlaybook = cases.filter((item) =>
      playbookStepLabels.some((label) => hasPlaybookCompleted(item, label))
    ).length;
    const playbookProgress = percent(casesWithCompletedPlaybook, totalCases);
    const missingIntentVerification = cases.filter((item) => item.status !== "Closed" && !hasPlaybookCompleted(item, "Verify member intent")).length;
    const openWithoutResult = cases.filter((item) => item.status !== "Closed" && !hasInterventionResult(item)).length;
    const stuckBeforeClosure = cases.filter(
      (item) => item.status !== "Closed" && hasInterventionResult(item) && !item.closure_summary
    ).length;

    const memberProtected = cases.filter((item) => item.outcome_type === "member_protected" || item.outcome_type === "customer_protected").length;
    const fundsLost = cases.filter((item) => item.outcome_type === "funds_sent_loss_occurred" || item.outcome_type === "funds_lost").length;

    const topSource = sourceRows[0];
    const topPattern = patternRows[0];
    const bottleneck =
      missingIntentVerification >= openWithoutResult && missingIntentVerification >= stuckBeforeClosure
        ? "Member intent verification"
        : openWithoutResult >= stuckBeforeClosure
          ? "Intervention result documentation"
          : "Closure documentation";

    return {
      totalCases,
      openCases,
      closedCases,
      escalatedCases,
      highCriticalCases,
      followUpRequired,
      protectedAmount,
      lostAmount,
      trustedContactEngaged,
      fraudOpsInvolved,
      patternRows,
      sourceRows,
      riskRows,
      sourceRiskRows,
      outcomeRows,
      completedStepRows,
      skippedStepRows,
      playbookProgress,
      missingIntentVerification,
      openWithoutResult,
      stuckBeforeClosure,
      memberProtected,
      fundsLost,
      topSource,
      topPattern,
      bottleneck,
      closureRate: percent(closedCases, totalCases),
      highCriticalShare: percent(highCriticalCases, totalCases),
      trustedContactRate: percent(trustedContactEngaged, closedCases || totalCases),
      fraudOpsRate: percent(fraudOpsInvolved, closedCases || totalCases),
    };
  }, [cases]);

  const emptyState = !isLoading && cases.length === 0;
  const canGenerateManagementBrief = auth.can("view_reporting");

  async function handleGenerateManagementBrief() {
    try {
      setBriefLoading(true);
      setBriefError("");
      const draft = await generateManagementBriefDraft();
      setBriefDraft(draft);
    } catch (error) {
      setBriefError(error instanceof Error ? error.message : "Unable to generate management brief.");
    } finally {
      setBriefLoading(false);
    }
  }

  async function handleCopyManagementBrief() {
    if (!briefDraft) return;
    try {
      await navigator.clipboard.writeText(briefDraft.draft);
      setBriefError("");
    } catch {
      setBriefError("Unable to copy draft from this browser.");
    }
  }

  return (
    <main className="page-wrap reporting-page-wrap reporting-v2-page workspace-shell">
      <section className="page-header reporting-console-header console-page-header">
        <div>
          <div className="page-kicker">Management reporting</div>
          <h1 className="page-title">Management reporting</h1>
          <p className="page-subtitle">Live workload, risk, outcomes, and intervention progress.</p>
        </div>

        <div className="reporting-console-actions">
          <div className="report-live-pill">
            {isLoading ? "Loading live backend data" : "Live view · backend case data"}
          </div>

          <div className="button-row">
            <Link href="/ops" className="button button-secondary">
              Open Operations
            </Link>
            <Link href="/cases/new" className="button">
              Start Intake
            </Link>
          </div>
        </div>
      </section>

      {loadError ? <div className="ops-inline-banner">{loadError}</div> : null}
      {emptyState ? (
        <div className="ops-inline-banner">
          Reporting will populate as intakes are submitted, playbook steps are logged, and outcomes are recorded.
        </div>
      ) : null}

      {canGenerateManagementBrief ? (
        <section className="workspace-panel console-panel reporting-assist-panel">
          <div className="reporting-assist-header">
            <div>
              <div className="page-kicker">Aegis Assist</div>
              <h2>Management brief draft</h2>
              <p>Draft from live reporting data. Review before use.</p>
            </div>
            <button
              type="button"
              className="button"
              onClick={() => void handleGenerateManagementBrief()}
              disabled={briefLoading}
            >
              {briefLoading ? "Generating..." : "Generate Management Brief"}
            </button>
          </div>

          {briefError ? <div className="assist-error">{briefError}</div> : null}

          {briefDraft ? (
            <div className="assist-draft-panel management-brief-draft">
              <div className="assist-draft-header">
                <div>
                  <span className="assist-draft-kicker">AI-generated draft</span>
                  <strong>Management brief</strong>
                </div>
                <span className="assist-provider">{briefDraft.provider}</span>
              </div>
              <pre>{briefDraft.draft}</pre>
              <div className="assist-source-line">Sources: {briefDraft.source_fields.slice(0, 6).join(", ")}</div>
              <div className="assist-disclaimer">{briefDraft.disclaimer}</div>
              <div className="button-row assist-draft-actions">
                <button type="button" className="button button-secondary button-compact" onClick={() => void handleCopyManagementBrief()}>
                  Copy Draft
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="management-briefing console-briefing-band">
        <div className="briefing-lead">
          <div className="page-kicker">Executive summary</div>
          <h2>{analytics.highCriticalCases ? `${analytics.highCriticalCases} elevated-risk cases need attention` : "No elevated-risk cases currently need attention"}</h2>
          <p>
            {analytics.topSource
              ? `${analytics.topSource.label} leads volume · ${analytics.topPattern?.label || "unknown patterns"} is most common.`
              : "Live trends appear as cases accumulate."}
          </p>
          <div className="briefing-metric-strip">
            <MetricPill label="Open" value={analytics.openCases} />
            <MetricPill label="High/Critical" value={`${analytics.highCriticalShare}%`} />
            <MetricPill label="Follow-up" value={analytics.followUpRequired} />
            <MetricPill label="Protected" value={currency(analytics.protectedAmount)} />
          </div>
        </div>

        <div className="briefing-attention">
          <h3>What needs attention now</h3>
          <InsightRow label="Missing intent verification" value={analytics.missingIntentVerification} />
          <InsightRow label="Open without intervention result" value={analytics.openWithoutResult} />
          <InsightRow label="Stuck before closure" value={analytics.stuckBeforeClosure} />
          <InsightRow label="Current bottleneck" value={analytics.bottleneck} />
        </div>
      </section>

      <section className="report-dashboard-primary">
        <section className="report-section dashboard-module">
          <SectionHeader
            eyebrow="Attention"
            title="Workload focus"
            description="Open cases and intervention gaps."
          />
          <div className="attention-grid attention-table">
            <AttentionCard label="Open cases" value={analytics.openCases} detail={`${analytics.escalatedCases} escalated`} />
            <AttentionCard label="High/Critical share" value={`${analytics.highCriticalShare}%`} detail={`${analytics.highCriticalCases} elevated-risk cases`} />
            <AttentionCard label="Playbook progress" value={`${analytics.playbookProgress}%`} detail="Cases with completed playbook work" />
            <AttentionCard label="Follow-up required" value={analytics.followUpRequired} detail="Needs post-closure or open follow-up" />
          </div>
        </section>

        <section className="report-section dashboard-module">
          <SectionHeader
            eyebrow="Outcomes"
            title="Outcome performance"
            description="Closure results and impact."
          />
          <div className="outcome-console-panel analytics-tile">
            <div className="compact-metric-strip outcome-metric-strip">
              <MetricPill label="Protected" value={currency(analytics.protectedAmount)} />
              <MetricPill label="Lost" value={currency(analytics.lostAmount)} />
              <MetricPill label="Closure rate" value={`${analytics.closureRate}%`} />
              <MetricPill label="Follow-up" value={analytics.followUpRequired} />
            </div>

            <div className="outcome-console-grid">
              <CompositionCard
                title="Outcome mix"
                description={analytics.protectedAmount >= analytics.lostAmount ? "Protected exceeds loss." : "Loss exceeds protected."}
                rows={analytics.outcomeRows}
                emptyText="No closure outcomes available yet."
              />
              <div className="reporting-list outcome-rows compact-outcome-rows">
                <InsightRow label="Closed cases" value={`${analytics.closedCases} (${analytics.closureRate}%)`} />
                <InsightRow label="Member protected" value={analytics.memberProtected} />
                <InsightRow label="Funds sent / loss occurred" value={analytics.fundsLost} />
                <InsightRow label="Trusted contact rate" value={`${analytics.trustedContactRate}%`} />
                <InsightRow label="Fraud ops involvement" value={`${analytics.fraudOpsRate}%`} />
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="report-section">
        <SectionHeader
          eyebrow="Patterns and source analysis"
          title="Pattern and source"
          description="Volume concentration and risk mix."
        />
        <div className="analytics-console-grid dashboard-module-grid">
          <div className="analytics-wide-panel">
            <BarCard title="Likely patterns" description="Case intelligence classification." rows={analytics.patternRows} />
          </div>
          <CompositionCard
            title="Source mix"
            description="Entry points."
            rows={analytics.sourceRows}
            emptyText="No source data available yet."
          />
        </div>
        <div className="analytics-console-grid drilldown-pair">
          <CompositionCard
            title="Risk mix"
            description="Urgency composition."
            rows={analytics.riskRows}
            emptyText="No risk data available yet."
          />
          <BarCard
            title="High/Critical concentration by source"
            description="Elevated-risk sources."
            rows={analytics.sourceRiskRows}
            emptyText="No high or critical cases currently need attention."
          />
        </div>
      </section>

      <section className="report-section">
        <SectionHeader
          eyebrow="Intervention"
          title="Playbook progress"
          description="Documentation and workflow gaps."
        />
        <div className="reporting-grid">
          <div className="progress-card">
            <h3>Workflow progress</h3>
            <div className="reporting-list">
              <InsightRow label="Any completed playbook step" value={`${analytics.playbookProgress}%`} />
              <InsightRow label="Open without intervention result" value={analytics.openWithoutResult} />
              <InsightRow label="Missing intent verification" value={analytics.missingIntentVerification} />
              <InsightRow label="Stuck before closure" value={analytics.stuckBeforeClosure} />
            </div>
          </div>
          <BarCard
            title="Most completed steps"
            description="Recorded interventions."
            rows={analytics.completedStepRows}
            emptyText="No completed playbook steps yet."
          />
        </div>
      </section>

      <section className="report-section report-drilldowns">
        <SectionHeader
          eyebrow="Drilldowns"
          title="Supporting detail"
          description="Skipped steps and closure records."
        />
        <div className="chart-grid">
          <BarCard
            title="Skipped playbook steps"
            description="Skipped workflow steps."
            rows={analytics.skippedStepRows}
            emptyText="No skipped playbook steps yet."
          />
          <BarCard
            title="Outcome mix"
            description="Closure outcome counts."
            rows={analytics.outcomeRows}
            emptyText="No closure outcomes available yet."
          />
        </div>
        <div className="workspace-panel drilldown-panel">
          <h3 className="workspace-section-title">Recent closure outcomes</h3>
          <div className="reporting-list">
            {cases.filter((item) => item.status === "Closed").slice(0, 6).map((item) => (
              <div className="reporting-row" key={item.id}>
                <div className="reporting-row-label">{item.case_id}</div>
                <div className="reporting-row-value">{outcomeLabel(item.outcome_type)}</div>
              </div>
            ))}
            {analytics.closedCases === 0 ? (
              <div className="readonly-box">Closed case outcomes will appear after operators submit closure workflows.</div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-pill analytics-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="reporting-row">
      <div className="reporting-row-label">{label}</div>
      <div className="reporting-row-value">{value}</div>
    </div>
  );
}

function AttentionCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="attention-card attention-row">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="report-section-header">
      <div className="page-kicker">{eyebrow}</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function BarCard({
  title,
  description,
  rows,
  emptyText = "No live data available yet.",
}: {
  title: string;
  description: string;
  rows: { label: string; value: number }[];
  emptyText?: string;
}) {
  const max = maxValue(rows);

  return (
    <div className="chart-card chart-tile">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="bar-list">
        {rows.length ? (
          rows.map((item, index) => {
            const pct = percent(item.value, max);
            return (
              <div className="bar-row" key={item.label}>
                <div className="bar-label-row">
                  <div className="bar-label">{item.label}</div>
                  <div className="bar-value">{item.value}</div>
                </div>
                <div className="bar-track">
                  <div className={`bar-fill ${barColor(index)}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="readonly-box">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

function CompositionCard({
  title,
  description,
  rows,
  emptyText = "No live data available yet.",
}: {
  title: string;
  description: string;
  rows: { label: string; value: number }[];
  emptyText?: string;
}) {
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  const visibleRows = rows.slice(0, 5);
  const remainingValue = rows.slice(5).reduce((sum, item) => sum + item.value, 0);
  const chartRows = remainingValue > 0 ? [...visibleRows, { label: "Other", value: remainingValue }] : visibleRows;

  return (
    <div className="composition-card chart-tile">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {total ? (
        <div className="composition-layout">
          <div className="composition-donut" style={{ background: compositionBackground(chartRows) }}>
            <span>{total}</span>
          </div>
          <div className="composition-legend">
            {chartRows.map((item, index) => (
              <div className="composition-legend-row" key={item.label}>
                <span style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
                <strong>{item.label}</strong>
                <em>{item.value}</em>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="readonly-box">{emptyText}</div>
      )}
    </div>
  );
}
