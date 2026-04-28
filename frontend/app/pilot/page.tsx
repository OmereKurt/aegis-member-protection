import Link from "next/link";

const demoRoles = [
  { role: "Branch user", email: "branch@aegis.local", scope: "Intake + case view" },
  { role: "Fraud analyst", email: "fraud@aegis.local", scope: "Case workbench" },
  { role: "Manager", email: "manager@aegis.local", scope: "Reporting view" },
  { role: "Admin", email: "admin@aegis.local", scope: "Demo utilities" },
];

const validationAreas = [
  "Intake",
  "Triage",
  "Investigation",
  "Guided intervention",
  "Closure outcomes",
  "Reporting",
];

const pilotSteps = [
  "Seed demo data",
  "Submit intake",
  "Work a case",
  "Close outcome",
  "Review reporting",
];

const successCriteria = [
  "Clear triage",
  "Owner handoff",
  "Consistent notes",
  "Outcome visibility",
  "Management briefing",
];

const enterpriseControls = [
  "Auth + RBAC",
  "CSRF protection",
  "Audit logging",
  "Postgres-ready",
  "Docker Compose",
  "Mock Assist mode",
];

export default function PilotPage() {
  return (
    <main className="page-wrap pilot-console-page workspace-shell">
      <section className="pilot-hero console-panel pilot-compact-hero">
        <div className="pilot-hero-copy">
          <div className="page-kicker">Design partner program</div>
          <h1>Pilot the member protection operating layer.</h1>
          <p>
            Evaluate intake, investigation, guided intervention, closure, and
            reporting for suspected elder exploitation workflows.
          </p>
          <div className="home-action-row">
            <Link href="/ops" className="button button-secondary">
              Open Operations
            </Link>
            <Link href="/cases/new" className="button button-secondary">
              Start Intake
            </Link>
            <Link href="/reporting" className="button">
              View Reporting
            </Link>
          </div>

          <div className="pilot-stat-strip">
            <div><span>Product</span><strong>Case operations</strong></div>
            <div><span>Focus</span><strong>Elder exploitation</strong></div>
            <div><span>Mode</span><strong>Local demo</strong></div>
          </div>
        </div>

        <aside className="pilot-fit-panel inspector-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Demo path</div>
              <h2>Workflow to review</h2>
            </div>
          </div>
          <div className="pilot-step-row pilot-step-row-compact">
            {pilotSteps.map((step, index) => (
              <div className="pilot-step" key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="pilot-console-grid pilot-compact-grid">
        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Demo users</div>
              <h2>Role-based access</h2>
            </div>
          </div>
          <div className="pilot-role-list">
            {demoRoles.map((user) => (
              <div className="pilot-role-row" key={user.email}>
                <div>
                  <strong>{user.role}</strong>
                  <span>{user.scope}</span>
                </div>
                <code>{user.email}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Workflow scope</div>
              <h2>What to test</h2>
            </div>
          </div>
          <div className="pilot-chip-grid">
            {validationAreas.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="pilot-console-grid pilot-compact-grid">
        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Enterprise posture</div>
              <h2>Included controls</h2>
            </div>
          </div>
          <div className="pilot-chip-grid">
            {enterpriseControls.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Success signals</div>
              <h2>What to look for</h2>
            </div>
          </div>
          <div className="pilot-list-grid two-column">
            {successCriteria.map((item) => (
              <div className="pilot-list-row" key={item}>
                <span />
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
