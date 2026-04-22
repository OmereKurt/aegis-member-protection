export default function LandingPage() {
  return (
    <main className="page-wrap">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-card">
            <div className="page-kicker">Member Protection Workflow</div>
            <h1>Help staff intervene before vulnerable members lose funds.</h1>
            <p>
              Aegis gives credit unions and regional banks a structured workflow to intake,
              triage, escalate, document, and report suspected elder financial exploitation cases.
            </p>
            <p>
              Instead of inconsistent branch notes and ad hoc escalation, your team gets one
              operating layer for member protection case handling.
            </p>

            <div className="hero-actions">
              <a href="/ops" className="button">Open Product Workspace</a>
              <a href="/reporting" className="button button-secondary">View Reporting</a>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <div className="metric-label">Built for</div>
              <div className="metric-value">Credit unions and regional banks</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Core workflow</div>
              <div className="metric-value">Intake → triage → escalation → documentation → closure</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Primary users</div>
              <div className="metric-value">Branch staff, contact center, fraud operations</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Why this exists</h2>
        <p className="section-subtitle">
          Financial institutions already face pressure to improve how suspected elder exploitation
          cases are recognized, escalated, documented, and reviewed. Aegis is designed to support
          that operational process.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Faster intake</h3>
            <p>
              Capture suspicious member events quickly from the branch, contact center,
              fraud operations, or other source units.
            </p>
          </div>

          <div className="feature-card">
            <h3>Clear intervention guidance</h3>
            <p>
              Turn raw narratives into urgency levels, structured escalation paths,
              and recommended next actions for staff.
            </p>
          </div>

          <div className="feature-card">
            <h3>Manager visibility</h3>
            <p>
              Track source units, outcomes, assignments, and case trends through lightweight reporting.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What the product does</h2>
        <p className="section-subtitle">
          Aegis is not another generic fraud dashboard. It is a workflow layer for suspected elder
          financial exploitation case handling.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Case intake</h3>
            <p>Guide staff through member context, suspicious event details, and structured risk indicators.</p>
          </div>

          <div className="feature-card">
            <h3>Operations workspace</h3>
            <p>Support case ownership, escalation, notes, timelines, and final outcome recording.</p>
          </div>

          <div className="feature-card">
            <h3>Reporting</h3>
            <p>Show managers where cases originate, how they resolve, and which teams are carrying the workload.</p>
          </div>
        </div>
      </section>

      <div className="footer-note">
        Early product build focused on workflow standardization for member protection teams.
      </div>
    </main>
  );
}
