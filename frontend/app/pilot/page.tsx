import Link from "next/link";

export default function PilotPage() {
  return (
    <main className="page-wrap">
      <div className="page-header">
        <div className="page-kicker">Design Partner Program</div>
        <h1 className="page-title">Pilot Aegis with your team</h1>
        <p className="page-subtitle">
          We are shaping Aegis with early design partners in credit unions and regional banks that want a more consistent workflow for suspected elder financial exploitation cases.
        </p>

        <div className="nav-row" style={{ marginTop: "16px" }}>
          <Link href="/ops">View Product Workspace</Link>
          <Link href="/reporting">View Reporting</Link>
        </div>
      </div>

      <section className="section">
        <div className="split-highlight">
          <div className="highlight-panel">
            <h3>What a design partner helps us do</h3>
            <p>
              Tighten the workflow with real-world feedback around intake, escalation, ownership, documentation, and reporting.
            </p>

            <div className="mini-pills">
              <div className="mini-pill">1–3 source units</div>
              <div className="mini-pill">Workflow feedback</div>
              <div className="mini-pill">Pilot collaboration</div>
            </div>
          </div>

          <div className="highlight-stats">
            <div className="highlight-stat">
              <div className="highlight-stat-label">Pilot goal</div>
              <div className="highlight-stat-value">Operational fit</div>
            </div>
            <div className="highlight-stat">
              <div className="highlight-stat-label">Primary outcome</div>
              <div className="highlight-stat-value">Handling consistency</div>
            </div>
            <div className="highlight-stat">
              <div className="highlight-stat-label">Best buyers</div>
              <div className="highlight-stat-value">Fraud, risk, and branch ops leaders</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Who this is for</h2>
        <div className="visual-grid">
          <div className="visual-card">
            <div className="icon-badge">CU</div>
            <h3>Credit unions</h3>
            <p>Teams handling member-facing scam and exploitation concerns across branches and operations.</p>
          </div>

          <div className="visual-card">
            <div className="icon-badge green">RB</div>
            <h3>Regional and community banks</h3>
            <p>Institutions that need a more structured workflow without building everything internally.</p>
          </div>

          <div className="visual-card">
            <div className="icon-badge amber">OP</div>
            <h3>Operational leaders</h3>
            <p>Fraud, risk, branch operations, and member-protection leaders who need better visibility.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What a pilot is meant to prove</h2>
        <div className="process-row">
          <div className="process-step">
            <div className="process-step-number">1</div>
            <h3>Cleaner intake</h3>
            <p>Can staff capture suspicious events faster and with better structure?</p>
          </div>

          <div className="process-step">
            <div className="process-step-number">2</div>
            <h3>Better routing</h3>
            <p>Can the team standardize escalation and reduce ad hoc workflow handoffs?</p>
          </div>

          <div className="process-step">
            <div className="process-step-number">3</div>
            <h3>Clearer records</h3>
            <p>Can managers and reviewers see stronger case history and outcomes?</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Typical pilot scope</h2>

        <div className="compact-points">
          <div className="compact-point">
            <div className="compact-point-mark">1</div>
            <div className="compact-point-text">
              <strong>Source units</strong>
              <span>1–3 operational areas such as a branch group, contact center, or fraud team.</span>
            </div>
          </div>

          <div className="compact-point">
            <div className="compact-point-mark">2</div>
            <div className="compact-point-text">
              <strong>Core workflow</strong>
              <span>Intake, urgency, assignment, escalation guidance, notes, closure, and reporting.</span>
            </div>
          </div>

          <div className="compact-point">
            <div className="compact-point-mark">3</div>
            <div className="compact-point-text">
              <strong>Feedback loop</strong>
              <span>Close collaboration on missing workflow steps, fields, ownership needs, and reporting priorities.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What we want to learn with you</h2>
        <div className="ops-surface">
          <div className="reporting-list">
            <div className="reporting-row">
              <div className="reporting-row-label">Where cases currently originate</div>
              <div className="muted">Branch, contact center, fraud ops, or other intake paths</div>
            </div>
            <div className="reporting-row">
              <div className="reporting-row-label">Where escalation becomes inconsistent</div>
              <div className="muted">Supervisor review, fraud ops review, trusted contact steps, reporting</div>
            </div>
            <div className="reporting-row">
              <div className="reporting-row-label">What management needs to see</div>
              <div className="muted">Case volume, outcomes, routing, ownership, and operational visibility</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-banner">
          <h2>Current stage: early product, focused on workflow fit</h2>
          <p>
            The goal right now is not broad rollout. The goal is finding strong design partners and tightening the workflow with the right operational teams.
          </p>

          <div className="hero-actions">
            <Link href="/ops" className="button">Open Product Workspace</Link>
            <Link href="/" className="button button-secondary">Back to Home</Link>
          </div>

          <div className="cta-mini-note">
            Best fit: institutions that want a more consistent member protection handling process.
          </div>
        </div>
      </section>
    </main>
  );
}
