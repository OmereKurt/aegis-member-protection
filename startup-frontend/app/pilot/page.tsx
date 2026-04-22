export default function PilotPage() {
  return (
    <main className="page-wrap">
      <div className="page-header">
        <div className="page-kicker">Design Partner Program</div>
        <h1 className="page-title">Pilot Aegis with your team</h1>
        <p className="page-subtitle">
          We are shaping Aegis with early design partners in credit unions and regional banks
          that want a more consistent workflow for suspected elder financial exploitation cases.
        </p>

        <div className="nav-row" style={{ marginTop: "16px" }}>
          <a href="/ops">View Product Workspace</a>
          <a href="/reporting">View Reporting</a>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Who this is for</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Credit unions</h3>
            <p>
              Teams handling member-facing scam and exploitation concerns across branches,
              contact center, and fraud operations.
            </p>
          </div>

          <div className="feature-card">
            <h3>Regional and community banks</h3>
            <p>
              Institutions that need a clearer intake, escalation, and documentation workflow
              without building everything internally.
            </p>
          </div>

          <div className="feature-card">
            <h3>Operational leaders</h3>
            <p>
              Fraud, risk, branch operations, or member-protection leaders who need more consistent handling
              and better visibility.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What a pilot is meant to prove</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Better intake consistency</h3>
            <p>Can staff capture suspicious events more cleanly and quickly than the current process?</p>
          </div>

          <div className="feature-card">
            <h3>Clearer escalation handling</h3>
            <p>Can the team standardize who sees what next, and reduce ad hoc case routing?</p>
          </div>

          <div className="feature-card">
            <h3>Stronger documentation</h3>
            <p>Can managers and reviewers see better case history, ownership, and outcomes?</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Typical pilot scope</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Source units</h3>
            <p>1–3 operational areas, such as a branch group, contact center, or fraud team.</p>
          </div>

          <div className="feature-card">
            <h3>Core workflow</h3>
            <p>Intake, urgency, assignment, escalation guidance, notes, closure, and reporting.</p>
          </div>

          <div className="feature-card">
            <h3>Feedback loop</h3>
            <p>Close collaboration on workflow gaps, missing fields, ownership needs, and reporting priorities.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What we’d want to learn with you</h2>
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
              <div className="muted">Case volume, outcomes, routing, ownership, and reporting needs</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Current stage</h2>
        <p className="section-subtitle">
          Early product, focused on workflow design and operational fit. The goal right now is
          not broad rollout — it is finding strong design partners and tightening the workflow.
        </p>

        <div className="hero-actions">
          <a href="/ops" className="button">Open Product Workspace</a>
          <a href="/" className="button button-secondary">Back to Home</a>
        </div>
      </section>
    </main>
  );
}
